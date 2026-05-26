import { DefaultTheme } from "@react-navigation/native"

export const colors = {
  background: "#F6F6F4",
  surface: "#FFFFFF",
  surfaceMuted: "#F3F4F6",
  primary: "#111111",
  primaryPressed: "#27272A",
  accent: "#0EA35A",
  textPrimary: "#111111",
  textSecondary: "#52525B",
  textMuted: "#71717A",
  border: "#E5E7EB",
  divider: "#ECEDEE",
  danger: "#D92D20",
  warning: "#D97706",
  info: "#2563EB",
  tabActive: "#111111",
  tabInactive: "#9CA3AF",
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
}

export const typography = {
  family: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },
  size: {
    caption: 12,
    body: 14,
    bodyLg: 16,
    subtitle: 18,
    title: 24,
    hero: 32,
  },
  lineHeight: {
    caption: 16,
    body: 20,
    bodyLg: 24,
    subtitle: 24,
    title: 30,
    hero: 38,
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
}

export const text = {
  hero: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.hero,
    lineHeight: typography.lineHeight.hero,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.subtitle,
    lineHeight: typography.lineHeight.subtitle,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    fontWeight: typography.weight.regular,
    color: colors.textSecondary,
  },
  bodyStrong: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.bodyLg,
    lineHeight: typography.lineHeight.bodyLg,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.regular,
    color: colors.textMuted,
  },
}

export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
}

export const navigation = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accent,
  },
}

const theme = {
  mode: "light",
  colors,
  spacing,
  radius,
  typography,
  text,
  shadows,
  navigation,
}

export default theme