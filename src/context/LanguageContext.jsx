import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
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
    activityLoading: "Loading trips...",
    activityEmptyState: "No trips yet. Your requested trips will appear here.",
    activityTrip: "Trip",
    activityStatusActive: "Active",
    activityStatusFinalized: "Finalized",
    activityTotalFare: "Total fare",
    activityDate: "Date",
    requestTripTitle: "Request Trip",
    pickupLabel: "Pickup",
    destinationLabel: "Destination",
    pickupPlaceholder: "Search pickup location",
    destinationPlaceholder: "Where to?",
    useCurrentLocation: "Use current location",
    currentLocationLabel: "Current location",
    tripCategoryLabel: "Category",
    tripCategoryPlaceholder: "Select category",
    categoryEconomy: "Economy",
    categoryXL: "XL",
    categoryPremium: "Premium",
    estimateTitle: "Estimated trip",
    estimateDistance: "Distance",
    estimateEta: "ETA",
    estimateFare: "Estimated fare",
    estimatingTrip: "Calculating route and fare...",
    gettingLocation: "Getting current location...",
    requestTripButton: "Request trip",
    resetTripPlan: "Reset",
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
    loading: "Loading...",
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
    alertLocationPermissionTitle: "Location permission needed",
    alertLocationPermissionMessage: "Enable location access to estimate routes and fares.",
    alertLocationError: "Could not get your current location right now.",
    alertPlacesError: "Could not load the selected place. Try another option.",
    alertRouteError: "Could not estimate this route right now.",
    alertMissingTripDataTitle: "Trip details missing",
    alertMissingTripData: "Please set pickup, destination, and category to request a trip.",
    alertTripSaveError: "Could not save trip right now. Please try again.",
    genderFemale: "Female",
    genderMale: "Male",
    genderOther: "Other",
    languageSpanish: "Spanish",
    languageEnglish: "English",
    loginToRequestTrip: "Please log in to request a trip.",
    currentTripLoading: "Loading trip...",
    currentTripNoTrip: "No active trip found.",
    currentTripDriverEnRoute: "On your way to your destination",
    currentTripFinalized: "Trip completed!",
    currentTripDriver: "Driver",
    alertTripLoadError: "Could not load trip data. Please try again.",
  },
  es: {
    navRequestTrip: "Pedir viaje",
    navActivity: "Actividad",
    navAccount: "Cuenta",
    activityLoading: "Cargando viajes...",
    activityEmptyState: "Aun no tienes viajes. Tus viajes solicitados apareceran aqui.",
    activityTrip: "Viaje",
    activityStatusActive: "Activo",
    activityStatusFinalized: "Finalizado",
    activityTotalFare: "Tarifa total",
    activityDate: "Fecha",
    requestTripTitle: "Pedir viaje",
    pickupLabel: "Origen",
    destinationLabel: "Destino",
    pickupPlaceholder: "Busca punto de origen",
    destinationPlaceholder: "A donde vas?",
    useCurrentLocation: "Usar ubicacion actual",
    currentLocationLabel: "Ubicacion actual",
    tripCategoryLabel: "Categoria",
    tripCategoryPlaceholder: "Selecciona categoria",
    categoryEconomy: "Economy",
    categoryXL: "XL",
    categoryPremium: "Premium",
    estimateTitle: "Estimacion del viaje",
    estimateDistance: "Distancia",
    estimateEta: "Tiempo estimado",
    estimateFare: "Tarifa estimada",
    estimatingTrip: "Calculando ruta y tarifa...",
    gettingLocation: "Obteniendo ubicacion actual...",
    requestTripButton: "Solicitar viaje",
    resetTripPlan: "Reiniciar",
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
    loading: "Cargando...",
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
    alertLocationPermissionTitle: "Permiso de ubicacion requerido",
    alertLocationPermissionMessage: "Activa ubicacion para estimar rutas y tarifas.",
    alertLocationError: "No se pudo obtener tu ubicacion actual.",
    alertPlacesError: "No se pudo cargar el lugar seleccionado. Intenta otro.",
    alertRouteError: "No se pudo estimar esta ruta en este momento.",
    alertMissingTripDataTitle: "Faltan datos del viaje",
    alertMissingTripData: "Define origen, destino y categoria para solicitar el viaje.",
    alertTripSaveError: "No se pudo guardar el viaje en este momento. Intenta nuevamente.",
    genderFemale: "Femenino",
    genderMale: "Masculino",
    genderOther: "Otro",
    languageSpanish: "Español",
    languageEnglish: "Inglés",
    loginToRequestTrip: "Por favor inicia sesión para solicitar un viaje.",
    currentTripLoading: "Cargando viaje...",
    currentTripNoTrip: "No se encontró un viaje activo.",
    currentTripDriverEnRoute: "Estás en camino a tu destino",
    currentTripFinalized: "¡Viaje completado!",
    currentTripDriver: "Conductor",
    alertTripLoadError: "No se pudieron cargar los datos del viaje. Intenta nuevamente.",
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

  const setLanguageFromAccountValue = useCallback((value) => {
    setLanguage(resolveLanguageCode(value))
  }, [])

  const t = useCallback((key, params) => {
    const selectedDictionary = translations[language] ?? translations.en
    const fallbackDictionary = translations.en
    const template = selectedDictionary[key] ?? fallbackDictionary[key] ?? key

    return interpolate(template, params)
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguageFromAccountValue,
      t,
    }),
    [language, setLanguageFromAccountValue, t]
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
