export const TRIP_CATEGORIES = [
  { value: "Economy", labelKey: "categoryEconomy" },
  { value: "XL", labelKey: "categoryXL" },
  { value: "Premium", labelKey: "categoryPremium" },
]

export const FARE_CONFIG = {
  Economy: {
    baseFare: 2.4,
    perKm: 0.82,
    perMinute: 0.22,
    surgeMultiplier: 1,
    minimumFare: 4.5,
  },
  XL: {
    baseFare: 3.8,
    perKm: 1.12,
    perMinute: 0.3,
    surgeMultiplier: 1,
    minimumFare: 6.4,
  },
  Premium: {
    baseFare: 5.6,
    perKm: 1.62,
    perMinute: 0.42,
    surgeMultiplier: 1,
    minimumFare: 9.2,
  },
}

const roundCurrency = (value) => Number(value.toFixed(2))

export const calculateEstimatedFare = ({
  distanceMeters,
  durationSeconds,
  category,
}) => {
  const selectedConfig = FARE_CONFIG[category] ?? FARE_CONFIG.Economy

  const distanceKm = distanceMeters / 1000
  const durationMinutes = durationSeconds / 60

  const distanceFare = distanceKm * selectedConfig.perKm
  const timeFare = durationMinutes * selectedConfig.perMinute
  const subtotal =
    selectedConfig.baseFare + distanceFare + timeFare

  const totalBeforeMinimum = subtotal * selectedConfig.surgeMultiplier
  const total = Math.max(selectedConfig.minimumFare, totalBeforeMinimum)

  return {
    category,
    distanceKm,
    durationMinutes,
    baseFare: roundCurrency(selectedConfig.baseFare),
    distanceFare: roundCurrency(distanceFare),
    timeFare: roundCurrency(timeFare),
    surgeMultiplier: selectedConfig.surgeMultiplier,
    minimumFare: roundCurrency(selectedConfig.minimumFare),
    total: roundCurrency(total),
  }
}
