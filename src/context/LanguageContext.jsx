import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useAccountContext } from "./AccountContext"
import { getAccount } from "../services/AccountService"

const SUPPORTED_LANGUAGES = {
  English: "en",
  Spanish: "es",
}

const translations = {
  en: {
    navRequestTrip: "Request Trip",
    navActivity: "Activity",
    navAccount: "Account",
    screenCurrentTrip: "Current Trip",
    screenPayment: "Payment",
    accountTitle: "Account",
    editAccount: "Edit Account",
    noPhoto: "No photo",
    selectPhoto: "Select Photo",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    gender: "Gender",
    email: "Email",
    language: "Language",
    enterFullName: "Enter full name",
    enterPhoneNumber: "Enter phone number",
    enterEmail: "Enter email",
    selectGender: "Select gender",
    selectLanguage: "Select language",
    cancel: "Cancel",
    saveAccount: "Save Account",
    saving: "Saving...",
    loadingAccount: "Loading account...",
    alertErrorTitle: "Error",
    alertLoadAccountError: "Could not load account details.",
    alertSaveAccountError: "Could not save account details.",
    alertMissingFieldTitle: "Missing field",
    alertMissingFullName: "Full Name is required.",
    alertInvalidFullNameTitle: "Invalid Full Name",
    alertInvalidFullName: "Full Name must be {{max}} characters or less.",
    alertMissingEmail: "Email is required.",
    alertInvalidEmailTitle: "Invalid Email",
    alertInvalidEmail: "Please enter a valid email address.",
    alertMissingFieldsTitle: "Missing fields",
    alertMissingFields: "Please complete all account fields before saving.",
    genderFemale: "Female",
    genderMale: "Male",
    genderOther: "Other",
    languageSpanish: "Spanish",
    languageEnglish: "English",
  },
  es: {
    navRequestTrip: "Pedir viaje",
    navActivity: "Actividad",
    navAccount: "Cuenta",
    screenCurrentTrip: "Viaje actual",
    screenPayment: "Pago",
    accountTitle: "Cuenta",
    editAccount: "Editar cuenta",
    noPhoto: "Sin foto",
    selectPhoto: "Seleccionar foto",
    fullName: "Nombre completo",
    phoneNumber: "Número de teléfono",
    gender: "Género",
    email: "Correo",
    language: "Idioma",
    enterFullName: "Ingresa el nombre completo",
    enterPhoneNumber: "Ingresa el número de teléfono",
    enterEmail: "Ingresa el correo",
    selectGender: "Selecciona género",
    selectLanguage: "Selecciona idioma",
    cancel: "Cancelar",
    saveAccount: "Guardar cuenta",
    saving: "Guardando...",
    loadingAccount: "Cargando cuenta...",
    alertErrorTitle: "Error",
    alertLoadAccountError: "No se pudieron cargar los datos de la cuenta.",
    alertSaveAccountError: "No se pudieron guardar los datos de la cuenta.",
    alertMissingFieldTitle: "Campo faltante",
    alertMissingFullName: "El nombre completo es obligatorio.",
    alertInvalidFullNameTitle: "Nombre completo inválido",
    alertInvalidFullName: "El nombre completo debe tener máximo {{max}} caracteres.",
    alertMissingEmail: "El correo es obligatorio.",
    alertInvalidEmailTitle: "Correo inválido",
    alertInvalidEmail: "Ingresa un correo válido.",
    alertMissingFieldsTitle: "Campos faltantes",
    alertMissingFields: "Completa todos los campos antes de guardar.",
    genderFemale: "Femenino",
    genderMale: "Masculino",
    genderOther: "Otro",
    languageSpanish: "Español",
    languageEnglish: "Inglés",
  },
}

const LanguageContext = createContext(null)

const resolveLanguageCode = (value) => SUPPORTED_LANGUAGES[value] ?? "en"

const interpolate = (template, params = {}) => {
  if (!template || typeof template !== "string") {
    return ""
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template
  )
}

export function LanguageProvider({ children }) {
  const { accountId, isReady } = useAccountContext()
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    let isMounted = true

    const syncLanguageFromAccount = async () => {
      if (!isReady) {
        return
      }

      if (!accountId) {
        if (isMounted) {
          setLanguage("en")
        }
        return
      }

      try {
        const account = await getAccount(accountId)
        const nextLanguage = resolveLanguageCode(account?.language)

        if (isMounted) {
          setLanguage(nextLanguage)
        }
      } catch (error) {
        if (isMounted) {
          setLanguage("en")
        }
      }
    }

    syncLanguageFromAccount()

    return () => {
      isMounted = false
    }
  }, [accountId, isReady])

  const setLanguageFromAccountValue = (value) => {
    setLanguage(resolveLanguageCode(value))
  }

  const t = (key, params) => {
    const selectedDictionary = translations[language] ?? translations.en
    const fallbackDictionary = translations.en
    const template = selectedDictionary[key] ?? fallbackDictionary[key] ?? key

    return interpolate(template, params)
  }

  const value = useMemo(
    () => ({
      language,
      setLanguageFromAccountValue,
      t,
    }),
    [language]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }

  return context
}
