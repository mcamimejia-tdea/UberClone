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
import { useLanguage } from "../context/LanguageContext"
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
const GENDER_OPTIONS = [
  { value: "Female", labelKey: "genderFemale" },
  { value: "Male", labelKey: "genderMale" },
  { value: "Other", labelKey: "genderOther" },
]
const LANGUAGE_OPTIONS = [
  { value: "Spanish", labelKey: "languageSpanish" },
  { value: "English", labelKey: "languageEnglish" },
]

const getOptionLabel = (value, options, t) => {
  const option = options.find((item) => item.value === value)
  return option ? t(option.labelKey) : value || "-"
}

function AccountScreen() {
  const { accountId, isReady, setAccountId } = useAccountContext()
  const { t, setLanguageFromAccountValue } = useLanguage()

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
        Alert.alert(t("alertErrorTitle"), t("alertLoadAccountError"))
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
        Alert.alert(t("alertMissingFieldTitle"), t("alertMissingFullName"))
        return
      }

      if (form.fullName.trim().length > MAX_FULL_NAME_LENGTH) {
        Alert.alert(
          t("alertInvalidFullNameTitle"),
          t("alertInvalidFullName", { max: MAX_FULL_NAME_LENGTH })
        )
        return
      }

      if (form.email.trim().length === 0) {
        Alert.alert(t("alertMissingFieldTitle"), t("alertMissingEmail"))
        return
      }

      if (!isEmailValid) {
        Alert.alert(t("alertInvalidEmailTitle"), t("alertInvalidEmail"))
        return
      }

      Alert.alert(t("alertMissingFieldsTitle"), t("alertMissingFields"))
      return
    }

    setIsSaving(true)
    try {
      if (!accountId) {
        const newAccountId = await createAccount(form)
        await setAccountId(newAccountId)

        const newAccount = { id: newAccountId, ...form }
        setAccount(newAccount)
        setLanguageFromAccountValue(form.language)
        setIsGenderDropdownOpen(false)
        setIsLanguageDropdownOpen(false)
        setIsEditMode(false)
        return
      }

      await updateAccount(accountId, form)
      const updatedAccount = { id: accountId, ...form }
      setAccount(updatedAccount)
      setLanguageFromAccountValue(form.language)
      setIsGenderDropdownOpen(false)
      setIsLanguageDropdownOpen(false)
      setIsEditMode(false)
    } catch (error) {
      Alert.alert(t("alertErrorTitle"), t("alertSaveAccountError"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!isReady || isLoading) {
    return (
      <SafeAreaView style={commonStyles.container} edges={["top"]}>
        <View style={commonStyles.centeredState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={commonStyles.loadingText}>{t("loadingAccount")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={commonStyles.content} showsVerticalScrollIndicator={false}>
        <View style={commonStyles.headerRow}>
          <Text style={theme.text.title}>{t("accountTitle")}</Text>
          {hasAccount && !isEditMode ? (
            <Pressable style={commonStyles.editButton} onPress={() => setIsEditMode(true)}>
              <Text style={commonStyles.editButtonText}>{t("editAccount")}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.photoCard}>
          {form.photo ? (
            <Image source={{ uri: form.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>{t("noPhoto")}</Text>
            </View>
          )}
          {isEditMode ? (
            <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
              <Text style={styles.photoButtonText}>{t("selectPhoto")}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={commonStyles.fieldGroup}>
          <Text style={commonStyles.label}>{t("fullName")}</Text>
          {isEditMode ? (
            <TextInput
              value={form.fullName}
              onChangeText={(value) => handleFieldChange("fullName", value)}
              placeholder={t("enterFullName")}
              placeholderTextColor={theme.colors.textMuted}
              maxLength={MAX_FULL_NAME_LENGTH}
              style={commonStyles.input}
            />
          ) : (
            <Text style={commonStyles.valueText}>{form.fullName || "-"}</Text>
          )}
        </View>

        <View style={commonStyles.fieldGroup}>
          <Text style={commonStyles.label}>{t("phoneNumber")}</Text>
          {isEditMode ? (
            <TextInput
              value={form.phoneNumber}
              onChangeText={(value) => handleFieldChange("phoneNumber", value)}
              placeholder={t("enterPhoneNumber")}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              style={commonStyles.input}
            />
          ) : (
            <Text style={commonStyles.valueText}>{form.phoneNumber || "-"}</Text>
          )}
        </View>

        <View style={commonStyles.fieldGroup}>
          <Text style={commonStyles.label}>{t("gender")}</Text>
          {isEditMode ? (
            <View>
              <Pressable
                style={commonStyles.dropdownTrigger}
                onPress={() => setIsGenderDropdownOpen((prev) => !prev)}
              >
                <Text style={form.gender ? commonStyles.dropdownValueText : commonStyles.dropdownPlaceholderText}>
                  {form.gender ? getOptionLabel(form.gender, GENDER_OPTIONS, t) : t("selectGender")}
                </Text>
              </Pressable>

              {isGenderDropdownOpen ? (
                <View style={commonStyles.dropdownList}>
                  {GENDER_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={commonStyles.dropdownOption}
                      onPress={() => {
                        handleFieldChange("gender", option.value)
                        setIsGenderDropdownOpen(false)
                      }}
                    >
                      <Text style={commonStyles.dropdownOptionText}>{t(option.labelKey)}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={commonStyles.valueText}>{getOptionLabel(form.gender, GENDER_OPTIONS, t)}</Text>
          )}
        </View>

        <View style={commonStyles.fieldGroup}>
          <Text style={commonStyles.label}>{t("email")}</Text>
          {isEditMode ? (
            <TextInput
              value={form.email}
              onChangeText={(value) => handleFieldChange("email", value)}
              placeholder={t("enterEmail")}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={commonStyles.input}
            />
          ) : (
            <Text style={commonStyles.valueText}>{form.email || "-"}</Text>
          )}
        </View>

        <View style={commonStyles.fieldGroup}>
          <Text style={commonStyles.label}>{t("language")}</Text>
          {isEditMode ? (
            <View>
              <Pressable
                style={commonStyles.dropdownTrigger}
                onPress={() => setIsLanguageDropdownOpen((prev) => !prev)}
              >
                <Text style={form.language ? commonStyles.dropdownValueText : commonStyles.dropdownPlaceholderText}>
                  {form.language ? getOptionLabel(form.language, LANGUAGE_OPTIONS, t) : t("selectLanguage")}
                </Text>
              </Pressable>

              {isLanguageDropdownOpen ? (
                <View style={commonStyles.dropdownList}>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={commonStyles.dropdownOption}
                      onPress={() => {
                        handleFieldChange("language", option.value)
                        setIsLanguageDropdownOpen(false)
                      }}
                    >
                      <Text style={commonStyles.dropdownOptionText}>{t(option.labelKey)}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={commonStyles.valueText}>{getOptionLabel(form.language, LANGUAGE_OPTIONS, t)}</Text>
          )}
        </View>

        {isEditMode ? (
          <View style={commonStyles.actionRow}>
            {hasAccount ? (
              <Pressable
                style={[commonStyles.actionButton, commonStyles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Text style={commonStyles.cancelButtonText}>{t("cancel")}</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[commonStyles.actionButton, commonStyles.saveButton, isSaving ? commonStyles.disabledButton : null]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={commonStyles.saveButtonText}>{isSaving ? t("saving") : t("saveAccount")}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
})

export default AccountScreen