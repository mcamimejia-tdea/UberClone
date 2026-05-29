import { StyleSheet } from "react-native"
import theme from "./theme"

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
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
  alertCard: {
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.md,
    backgroundColor: "#FFF7ED",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  alertText: {
    ...theme.text.body,
    color: theme.colors.warning,
    fontWeight: theme.typography.weight.semibold,
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