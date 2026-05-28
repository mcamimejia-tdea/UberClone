import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import commonStyles from "../styles/commonStyles"
import theme from "../styles/theme"
import { useAccountContext } from "../context/AccountContext"
import {
  createAccount,
  getAccount,
  pickAccountPhoto,
  updateAccount,
} from "../services/AccountService"

const EMPTY_FORM = {
  fullName: "",
  phoneNumber: "",
  gender: "",
  email: "",
  language: "",
  photo: null,
}

const MAX_FULL_NAME_LENGTH = 50
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GENDER_OPTIONS = ["Female", "Male", "Other"]
const LANGUAGE_OPTIONS = ["Spanish", "English"]

function AccountScreen() {
  const { accountId, isReady, setAccountId } = useAccountContext()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false)
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [account, setAccount] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const hasAccount = Boolean(account)
  const isFullNameValid = form.fullName.trim().length > 0 && form.fullName.trim().length <= MAX_FULL_NAME_LENGTH
  const isEmailValid = EMAIL_REGEX.test(form.email.trim())
  const canSubmit = useMemo(() => {
    return (
      isFullNameValid &&
      form.phoneNumber.trim().length > 0 &&
      form.gender.trim().length > 0 &&
      isEmailValid &&
      form.language.trim().length > 0
    )
  }, [form, isEmailValid, isFullNameValid])

  useEffect(() => {
    const loadAccount = async () => {
      if (!isReady) {
        return
      }

      if (!accountId) {
        setAccount(null)
        setForm(EMPTY_FORM)
        setIsEditMode(true)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const accountData = await getAccount(accountId)
        if (!accountData) {
          setAccount(null)
          setForm(EMPTY_FORM)
          setIsEditMode(true)
          return
        }

        setAccount(accountData)
        setForm({
          fullName: accountData.fullName ?? "",
          phoneNumber: accountData.phoneNumber ?? "",
          gender: accountData.gender ?? "",
          email: accountData.email ?? "",
          language: accountData.language ?? "",
          photo: accountData.photo ?? null,
        })
        setIsEditMode(false)
      } catch (error) {
        Alert.alert("Error", "Could not load account details.")
      } finally {
        setIsLoading(false)
      }
    }

    loadAccount()
  }, [accountId, isReady])

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePickPhoto = async () => {
    const selectedPhoto = await pickAccountPhoto()
    if (selectedPhoto) {
      setForm((prev) => ({ ...prev, photo: selectedPhoto }))
    }
  }

  const handleCancelEdit = () => {
    setIsGenderDropdownOpen(false)
    setIsLanguageDropdownOpen(false)

    if (!account) {
      setForm(EMPTY_FORM)
      return
    }

    setForm({
      fullName: account.fullName ?? "",
      phoneNumber: account.phoneNumber ?? "",
      gender: account.gender ?? "",
      email: account.email ?? "",
      language: account.language ?? "",
      photo: account.photo ?? null,
    })
    setIsEditMode(false)
  }

  const handleSave = async () => {
    if (!canSubmit) {
      if (form.fullName.trim().length === 0) {
        Alert.alert("Missing field", "Full Name is required.")
        return
      }

      if (form.fullName.trim().length > MAX_FULL_NAME_LENGTH) {
        Alert.alert("Invalid Full Name", `Full Name must be ${MAX_FULL_NAME_LENGTH} characters or less.`)
        return
      }

      if (form.email.trim().length === 0) {
        Alert.alert("Missing field", "Email is required.")
        return
      }

      if (!isEmailValid) {
        Alert.alert("Invalid Email", "Please enter a valid email address.")
        return
      }

      Alert.alert("Missing fields", "Please complete all account fields before saving.")
      return
    }

    setIsSaving(true)
    try {
      if (!accountId) {
        const newAccountId = await createAccount(form)
        await setAccountId(newAccountId)

        const newAccount = { id: newAccountId, ...form }
        setAccount(newAccount)
        setIsGenderDropdownOpen(false)
        setIsLanguageDropdownOpen(false)
        setIsEditMode(false)
        return
      }

      await updateAccount(accountId, form)
      const updatedAccount = { id: accountId, ...form }
      setAccount(updatedAccount)
      setIsGenderDropdownOpen(false)
      setIsLanguageDropdownOpen(false)
      setIsEditMode(false)
    } catch (error) {
      Alert.alert("Error", "Could not save account details.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isReady || isLoading) {
    return (
      <SafeAreaView style={commonStyles.container} edges={["top"]}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading account...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={theme.text.title}>Account</Text>
          {hasAccount && !isEditMode ? (
            <Pressable style={styles.editButton} onPress={() => setIsEditMode(true)}>
              <Text style={styles.editButtonText}>Edit Account</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.photoCard}>
          {form.photo ? (
            <Image source={{ uri: form.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>No photo</Text>
            </View>
          )}
          {isEditMode ? (
            <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
              <Text style={styles.photoButtonText}>Select Photo</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name</Text>
          {isEditMode ? (
            <TextInput
              value={form.fullName}
              onChangeText={(value) => handleFieldChange("fullName", value)}
              placeholder="Enter full name"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={MAX_FULL_NAME_LENGTH}
              style={styles.input}
            />
          ) : (
            <Text style={styles.valueText}>{form.fullName || "-"}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone Number</Text>
          {isEditMode ? (
            <TextInput
              value={form.phoneNumber}
              onChangeText={(value) => handleFieldChange("phoneNumber", value)}
              placeholder="Enter phone number"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              style={styles.input}
            />
          ) : (
            <Text style={styles.valueText}>{form.phoneNumber || "-"}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Gender</Text>
          {isEditMode ? (
            <View>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => setIsGenderDropdownOpen((prev) => !prev)}
              >
                <Text style={form.gender ? styles.dropdownValueText : styles.dropdownPlaceholderText}>
                  {form.gender || "Select gender"}
                </Text>
              </Pressable>

              {isGenderDropdownOpen ? (
                <View style={styles.dropdownList}>
                  {GENDER_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        handleFieldChange("gender", option)
                        setIsGenderDropdownOpen(false)
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.valueText}>{form.gender || "-"}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          {isEditMode ? (
            <TextInput
              value={form.email}
              onChangeText={(value) => handleFieldChange("email", value)}
              placeholder="Enter email"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          ) : (
            <Text style={styles.valueText}>{form.email || "-"}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Language</Text>
          {isEditMode ? (
            <View>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => setIsLanguageDropdownOpen((prev) => !prev)}
              >
                <Text style={form.language ? styles.dropdownValueText : styles.dropdownPlaceholderText}>
                  {form.language || "Select language"}
                </Text>
              </Pressable>

              {isLanguageDropdownOpen ? (
                <View style={styles.dropdownList}>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        handleFieldChange("language", option)
                        setIsLanguageDropdownOpen(false)
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.valueText}>{form.language || "-"}</Text>
          )}
        </View>

        {isEditMode ? (
          <View style={styles.actionRow}>
            {hasAccount ? (
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[styles.actionButton, styles.saveButton, isSaving ? styles.disabledButton : null]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save Account"}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  centeredState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.text.body,
  },
  content: {
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
  },
  editButtonText: {
    ...theme.text.caption,
    color: theme.colors.surface,
    fontWeight: theme.typography.weight.semibold,
  },
  photoCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  photo: {
    width: 128,
    height: 128,
    borderRadius: theme.radius.pill,
  },
  photoPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  photoPlaceholderText: {
    ...theme.text.caption,
  },
  photoButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoButtonText: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
  },
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.text.caption,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.textSecondary,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.bodyLg,
  },
  dropdownTrigger: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  dropdownValueText: {
    ...theme.text.bodyStrong,
  },
  dropdownPlaceholderText: {
    ...theme.text.body,
    color: theme.colors.textMuted,
  },
  dropdownList: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  dropdownOptionText: {
    ...theme.text.bodyStrong,
  },
  valueText: {
    ...theme.text.bodyStrong,
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    ...theme.text.body,
    color: theme.colors.surface,
    fontWeight: theme.typography.weight.semibold,
  },
  disabledButton: {
    opacity: 0.7,
  },
})

export default AccountScreen