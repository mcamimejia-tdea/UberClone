import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import LoadingScreen from "./LoadingScreen"
import HeaderRow from "../components/HeaderRow"
import ActionRow from "../components/ActionRow"
import FieldGroupText from "../components/FieldGroupText"
import FieldGroupSelect from "../components/FieldGroupSelect"

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

function AccountScreen() {
  const { accountId, isReady, setAccountId } = useAccountContext()
  const { t, setLanguageFromAccountValue } = useLanguage()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
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
        setIsEditMode(false)
        return
      }

      await updateAccount(accountId, form)
      const updatedAccount = { id: accountId, ...form }
      setAccount(updatedAccount)
      setLanguageFromAccountValue(form.language)
      setIsEditMode(false)
    } catch (error) {
      Alert.alert(t("alertErrorTitle"), t("alertSaveAccountError"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!isReady || isLoading) {
    return (
      <LoadingScreen loadingText={t("loadingAccount")} />
    )
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={commonStyles.content} showsVerticalScrollIndicator={false}>
        <HeaderRow
          title={t("accountTitle")}
          actionText={!isEditMode && hasAccount ? t("editAccount") : null}
          onActionPress={() => setIsEditMode(true)}
        />

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

        <FieldGroupText
          label={t("fullName")}
          isEditMode={isEditMode}
          value={form.fullName}
          onChangeText={(value) => handleFieldChange("fullName", value)}
          placeholder={t("enterFullName")}
          placeholderTextColor={theme.colors.textMuted}
          maxLength={MAX_FULL_NAME_LENGTH}
          displayValue={form.fullName || "-"}
        />

        <FieldGroupText
          label={t("phoneNumber")}
          isEditMode={isEditMode}
          value={form.phoneNumber}
          onChangeText={(value) => handleFieldChange("phoneNumber", value)}
          placeholder={t("enterPhoneNumber")}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="phone-pad"
          displayValue={form.phoneNumber || "-"}
        />

        <FieldGroupSelect
          label={t("gender")}
          isEditMode={isEditMode}
          value={form.gender}
          options={GENDER_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
          onSelect={(value) => handleFieldChange("gender", value)}
          placeholder={t("selectGender")}
        />

        <FieldGroupText
          label={t("email")}
          isEditMode={isEditMode}
          value={form.email}
          onChangeText={(value) => handleFieldChange("email", value)}
          placeholder={t("enterEmail")}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          displayValue={form.email || "-"}
        />

        <FieldGroupSelect
          label={t("language")}
          isEditMode={isEditMode}
          value={form.language}
          options={LANGUAGE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
          onSelect={(value) => handleFieldChange("language", value)}
          placeholder={t("selectLanguage")}
        />

        {isEditMode ? (
          <ActionRow
            saveText={isSaving ? t("saving") : t("saveAccount")}
            handleSave={handleSave}
            cancelText={hasAccount ? t("cancel") : null}
            handleCancel={hasAccount ? handleCancelEdit : null}
            disabled={isSaving}
          />
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