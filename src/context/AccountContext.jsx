import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const ACCOUNT_ID_KEY = "@uberclone/accountId"

const AccountContext = createContext(null)

export function AccountProvider({ children }) {
  const [accountId, setAccountIdState] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadAccountId = async () => {
      try {
        const savedAccountId = await AsyncStorage.getItem(ACCOUNT_ID_KEY)
        if (isMounted) {
          setAccountIdState(savedAccountId)
        }
      } catch (error) {
        if (isMounted) {
          setAccountIdState(null)
        }
      } finally {
        if (isMounted) {
          setIsReady(true)
        }
      }
    }

    loadAccountId()

    return () => {
      isMounted = false
    }
  }, [])

  const setAccountId = useCallback(async (newAccountId) => {
    if (newAccountId) {
      await AsyncStorage.setItem(ACCOUNT_ID_KEY, newAccountId)
      setAccountIdState(newAccountId)
      return
    }

    await AsyncStorage.removeItem(ACCOUNT_ID_KEY)
    setAccountIdState(null)
  }, [])

  const clearAccountId = useCallback(async () => {
    await AsyncStorage.removeItem(ACCOUNT_ID_KEY)
    setAccountIdState(null)
  }, [])

  const value = useMemo(
    () => ({
      accountId,
      isReady,
      setAccountId,
      clearAccountId,
    }),
    [accountId, isReady, setAccountId, clearAccountId]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccountContext() {
  const context = useContext(AccountContext)

  if (!context) {
    throw new Error("useAccountContext must be used within an AccountProvider")
  }

  return context
}
