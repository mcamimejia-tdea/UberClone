import { useCallback, useEffect, useMemo, useRef } from "react"
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import MapView, { Marker, Polyline } from "react-native-maps"
import Geolocation from "react-native-geolocation-service"
import { SafeAreaView } from "react-native-safe-area-context"
import { useDispatch, useSelector } from "react-redux"
import ActionRow from "../components/ActionRow"
import FieldGroupSelect from "../components/FieldGroupSelect"
import FieldGroupText from "../components/FieldGroupText"
import HeaderRow from "../components/HeaderRow"
import { useAccountContext } from "../context/AccountContext"
import { useLanguage } from "../context/LanguageContext"
import { TRIP_CATEGORIES } from "../constants/fareConfig"
import {
  cacheRequestedTrip,
  clearError,
  clearPredictions,
  fetchPlaceSuggestions,
  fetchRouteEstimate,
  resetTripPlanner,
  resolveSuggestion,
  setCurrentLocation,
  setLocationLoading,
  setPickupFromCurrentLocation,
  setQuery,
  setSelectedCategory,
} from "../store/slices/tripSlice"
import { createTrip } from "../services/TripService"
import { formatCopCurrency } from "../utils/currency"
import commonStyles from "../styles/commonStyles"
import theme from "../styles/theme"

const FALLBACK_REGION = {
  latitude: 13.6929,
  longitude: -89.2182,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
}

const MAP_EDGE_PADDING = {
  top: 90,
  right: 64,
  bottom: 90,
  left: 64,
}

const getLanguageCode = (language) => (language === "es" ? "es" : "en")

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      }
    )
  })
}

const requestLocationPermission = async () => {
  if (Platform.OS === "ios") {
    const status = await Geolocation.requestAuthorization("whenInUse")
    return status === "granted"
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Location permission",
      message: "UberClone needs your location to suggest pickup and routes.",
      buttonPositive: "Allow",
      buttonNegative: "Deny",
    }
  )

  return result === PermissionsAndroid.RESULTS.GRANTED
}

function RequestTripScreen({ navigation }) {
  const dispatch = useDispatch()
  const mapRef = useRef(null)
  const locationInitializedRef = useRef(false)
  const pickupPlaceRef = useRef(null)
  const { t, language } = useLanguage()
  const { accountId } = useAccountContext()

  const {
    currentLocation,
    pickupQuery,
    destinationQuery,
    pickupPredictions,
    destinationPredictions,
    pickupPlace,
    destinationPlace,
    selectedCategory,
    route,
    estimate,
    isLocationLoading,
    isAutocompleteLoading,
    isEstimateLoading,
    autocompleteField,
    error,
  } = useSelector((state) => state.trip)

  const languageCode = getLanguageCode(language)

  useEffect(() => {
    pickupPlaceRef.current = pickupPlace
  }, [pickupPlace])

  const mapRegion = useMemo(() => {
    if (!currentLocation) {
      return FALLBACK_REGION
    }

    return {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }
  }, [currentLocation])

  const categoryOptions = useMemo(
    () => TRIP_CATEGORIES.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )

  const canRequestTrip = Boolean(
    pickupPlace?.location &&
      destinationPlace?.location &&
      estimate?.fare?.total &&
      !isEstimateLoading &&
      accountId
  )

  const displayedRouteCoordinates = useMemo(() => {
    if (route?.polylineCoordinates?.length > 1) {
      return route.polylineCoordinates.map((c) => ({
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
      }))
    }

    if (pickupPlace?.location && destinationPlace?.location) {
      return [
        {
          latitude: Number(pickupPlace.location.latitude),
          longitude: Number(pickupPlace.location.longitude),
        },
        {
          latitude: Number(destinationPlace.location.latitude),
          longitude: Number(destinationPlace.location.longitude),
        },
      ]
    }

    return []
  }, [route, pickupPlace, destinationPlace])

  const loadCurrentLocation = useCallback(async () => {
    dispatch(setLocationLoading(true))

    try {
      const hasPermission = await requestLocationPermission()

      if (!hasPermission) {
        Alert.alert(t("alertLocationPermissionTitle"), t("alertLocationPermissionMessage"))
        return
      }

      const position = await getCurrentPosition()
      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }

      dispatch(setCurrentLocation(nextLocation))

      if (!pickupPlaceRef.current?.location) {
        dispatch(
          setPickupFromCurrentLocation({
            title: t("currentLocationLabel"),
            address: t("currentLocationLabel"),
            location: nextLocation,
          })
        )
      }
    } catch (locationError) {
      Alert.alert(t("alertErrorTitle"), t("alertLocationError"))
    } finally {
      dispatch(setLocationLoading(false))
    }
  }, [dispatch, t])

  useEffect(() => {
    if (locationInitializedRef.current) {
      return
    }
    locationInitializedRef.current = true
    loadCurrentLocation()
  }, [loadCurrentLocation])

  useEffect(() => {
    if (pickupPlace?.address && pickupQuery.trim() === pickupPlace.address) {
      dispatch(clearPredictions("pickup"))
      return
    }

    const timeoutId = setTimeout(() => {
      dispatch(
        fetchPlaceSuggestions({
          field: "pickup",
          query: pickupQuery,
          language: languageCode,
          currentLocation,
        })
      )
    }, 350)

    return () => clearTimeout(timeoutId)
  }, [dispatch, pickupQuery, pickupPlace, currentLocation, languageCode])

  useEffect(() => {
    if (destinationPlace?.address && destinationQuery.trim() === destinationPlace.address) {
      dispatch(clearPredictions("destination"))
      return
    }

    const timeoutId = setTimeout(() => {
      dispatch(
        fetchPlaceSuggestions({
          field: "destination",
          query: destinationQuery,
          language: languageCode,
          currentLocation,
        })
      )
    }, 350)

    return () => clearTimeout(timeoutId)
  }, [dispatch, destinationQuery, destinationPlace, currentLocation, languageCode])

  useEffect(() => {
    if (!pickupPlace?.location || !destinationPlace?.location) {
      return
    }

    dispatch(
      fetchRouteEstimate({
        origin: pickupPlace.location,
        destination: destinationPlace.location,
        language: languageCode,
        category: selectedCategory,
      })
    )
  }, [dispatch, pickupPlace, destinationPlace, selectedCategory, languageCode])

  useEffect(() => {
    if (!error) {
      return
    }

    Alert.alert(t("alertErrorTitle"), t("alertRouteError"))
    dispatch(clearError())
  }, [dispatch, error, t])

  useEffect(() => {
    if (!mapRef.current || !currentLocation) {
      return
    }

    mapRef.current.animateToRegion(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      800
    )
  }, [currentLocation])

  useEffect(() => {
    if (!mapRef.current || !pickupPlace?.location || !destinationPlace?.location) {
      return
    }

    mapRef.current.fitToCoordinates(
      [pickupPlace.location, destinationPlace.location],
      {
        edgePadding: MAP_EDGE_PADDING,
        animated: true,
      }
    )
  }, [pickupPlace, destinationPlace, route])

  const handleSelectSuggestion = async (field, placeId) => {
    try {
      await dispatch(resolveSuggestion({ field, placeId, language: languageCode })).unwrap()
    } catch (placeError) {
      Alert.alert(t("alertErrorTitle"), t("alertPlacesError"))
    }
  }

  const handleUseCurrentLocation = async () => {
    if (currentLocation) {
      dispatch(
        setPickupFromCurrentLocation({
          title: t("currentLocationLabel"),
          address: t("currentLocationLabel"),
          location: currentLocation,
        })
      )
      return
    }

    await loadCurrentLocation()
  }

  const handleRequestTrip = async () => {
    if (!canRequestTrip) {
      Alert.alert(t("alertMissingTripDataTitle"), t("alertMissingTripData"))
      return
    }

    const tripPayload = {
      accountId,
      pickup: pickupPlace,
      destination: destinationPlace,
      route,
      estimate,
      category: selectedCategory,
      createdAt: new Date().toISOString(),
      status: "active"
    }

    let requestId

    try {
      requestId = await createTrip(tripPayload)
    } catch (_saveError) {
      Alert.alert(t("alertErrorTitle"), t("alertTripSaveError"))
      return
    }

    dispatch(
      cacheRequestedTrip({
        id: requestId,
        ...tripPayload,
      })
    )

    dispatch(resetTripPlanner())

    navigation.navigate("Payment", { tripId: requestId })
  }

  const handleReset = () => {
    dispatch(resetTripPlanner())
  }

  const renderSuggestionList = (field, items) => {
    if (!items.length) {
      return null
    }

    return (
      <View style={styles.suggestionsCard}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.suggestionItem}
            onPress={() => handleSelectSuggestion(field, item.placeId)}
          >
            <Text style={styles.suggestionTitle}>{item.title}</Text>
            {item.subtitle ? (
              <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={commonStyles.content} showsVerticalScrollIndicator={false}>
        <HeaderRow title={t("requestTripTitle")} />

        <View style={commonStyles.mapCard}>
          <MapView
            ref={mapRef}
            style={commonStyles.map}
            initialRegion={mapRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {pickupPlace?.location ? (
              <Marker coordinate={pickupPlace.location} title={t("pickupLabel")} pinColor={theme.colors.accent} />
            ) : null}

            {destinationPlace?.location ? (
              <Marker coordinate={destinationPlace.location} title={t("destinationLabel")} pinColor={theme.colors.danger} />
            ) : null}

            {displayedRouteCoordinates.length > 1 ? (
              <Polyline
                key={`${displayedRouteCoordinates.length}-${pickupPlace?.location?.latitude ?? ""}-${destinationPlace?.location?.latitude ?? ""}`}
                coordinates={displayedRouteCoordinates}
                strokeColor={theme.colors.info}
                strokeWidth={5}
                geodesic
              />
            ) : null}
          </MapView>
        </View>

        <View style={styles.formCard}>
          <FieldGroupText
            label={t("pickupLabel")}
            isEditMode
            value={pickupQuery}
            onChangeText={(value) => dispatch(setQuery({ field: "pickup", value }))}
            placeholder={t("pickupPlaceholder")}
            placeholderTextColor={theme.colors.textMuted}
          />
          {isAutocompleteLoading && autocompleteField === "pickup" ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : null}
          {renderSuggestionList("pickup", pickupPredictions)}

          <Pressable style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
            <Text style={styles.currentLocationButtonText}>
              {isLocationLoading ? t("gettingLocation") : t("useCurrentLocation")}
            </Text>
          </Pressable>

          <FieldGroupText
            label={t("destinationLabel")}
            isEditMode
            value={destinationQuery}
            onChangeText={(value) => dispatch(setQuery({ field: "destination", value }))}
            placeholder={t("destinationPlaceholder")}
            placeholderTextColor={theme.colors.textMuted}
          />
          {isAutocompleteLoading && autocompleteField === "destination" ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : null}
          {renderSuggestionList("destination", destinationPredictions)}

          <FieldGroupSelect
            label={t("tripCategoryLabel")}
            isEditMode
            value={selectedCategory}
            options={categoryOptions}
            onSelect={(value) => dispatch(setSelectedCategory(value))}
            placeholder={t("tripCategoryPlaceholder")}
          />
        </View>

        <View style={styles.estimateCard}>
          <Text style={styles.estimateTitle}>{t("estimateTitle")}</Text>

          {isEstimateLoading ? (
            <Text style={styles.estimateValue}>{t("estimatingTrip")}</Text>
          ) : (
            <>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{t("estimateDistance")}</Text>
                <Text style={styles.metricValue}>{estimate?.distanceText ?? "-"}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{t("estimateEta")}</Text>
                <Text style={styles.metricValue}>{estimate?.durationText ?? "-"}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{t("estimateFare")}</Text>
                <Text style={styles.metricTotal}>
                  {estimate?.fare?.total ? formatCopCurrency(estimate.fare.total, language) : "-"}
                </Text>
              </View>
            </>
          )}
        </View>

        {!accountId && (
          <View style={commonStyles.alertCard}>
            <Text style={commonStyles.alertText}>{t("loginToRequestTrip")}</Text>
          </View>
        )}

        <ActionRow
          saveText={t("requestTripButton")}
          handleSave={handleRequestTrip}
          cancelText={t("resetTripPlan")}
          handleCancel={handleReset}
          disabled={!canRequestTrip}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  formCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  suggestionsCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  suggestionTitle: {
    ...theme.text.bodyStrong,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  suggestionSubtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  currentLocationButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
  },
  currentLocationButtonText: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weight.medium,
  },
  estimateCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  estimateTitle: {
    ...theme.text.subtitle,
    fontSize: theme.typography.size.bodyLg,
    lineHeight: theme.typography.lineHeight.bodyLg,
  },
  estimateValue: {
    ...theme.text.body,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  metricLabel: {
    ...theme.text.body,
  },
  metricValue: {
    ...theme.text.bodyStrong,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  metricTotal: {
    ...theme.text.bodyStrong,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
  },
})

export default RequestTripScreen