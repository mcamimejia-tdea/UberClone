export const TRIP_CATEGORIES = [
  { value: "Economy", labelKey: "categoryEconomy" },
  { value: "XL", labelKey: "categoryXL" },
  { value: "Premium", labelKey: "categoryPremium" },
]

export const FARE_CONFIG = {
  Economy: {
    baseFare: 3000,
    perKm: 1500,
    perMinute: 400,
    surgeMultiplier: 1,
    minimumFare: 10000,
  },
  XL: {
    baseFare: 6000,
    perKm: 3000,
    perMinute: 800,
    surgeMultiplier: 1,
    minimumFare: 20000,
  },
  Premium: {
    baseFare: 9000,
    perKm: 4500,
    perMinute: 1200,
    surgeMultiplier: 1,
    minimumFare: 30000,
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
