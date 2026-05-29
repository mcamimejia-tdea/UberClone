export const formatCopCurrency = (amount, language = "es") => {
  if (typeof amount !== "number") {
    return "-"
  }

  const locale = language === "es" ? "es-CO" : "en-CO"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount)
}
