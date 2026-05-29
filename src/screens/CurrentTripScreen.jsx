import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import MapView, { Marker, Polyline } from "react-native-maps"
import { SafeAreaView } from "react-native-safe-area-context"
import { useDispatch, useSelector } from "react-redux"
import HeaderRow from "../components/HeaderRow"
import { useAccountContext } from "../context/AccountContext"
import { useLanguage } from "../context/LanguageContext"
import { cacheRequestedTrip } from "../store/slices/tripSlice"
import { getActiveTripByAccountId, updateTripStatus } from "../services/TripService"
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

const ANIMATION_DURATION = 60000
const TICK_INTERVAL = 500

const interpolateAlongPath = (coords, progress) => {
  if (progress <= 0) return coords[0]
  if (progress >= 1) return coords[coords.length - 1]

  const totalSegments = coords.length - 1
  const scaledProgress = progress * totalSegments
  const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1)
  const segmentProgress = scaledProgress - segmentIndex

  const from = coords[segmentIndex]
  const to = coords[segmentIndex + 1]

  return {
    latitude: from.latitude + (to.latitude - from.latitude) * segmentProgress,
    longitude: from.longitude + (to.longitude - from.longitude) * segmentProgress,
  }
}

function CurrentTripScreen({ navigation }) {
  const dispatch = useDispatch()
  const mapRef = useRef(null)
  const animationRef = useRef(null)
  const startTimeRef = useRef(null)
  const { t, language } = useLanguage()
  const { accountId } = useAccountContext()
  const requestedTrip = useSelector((state) => state.trip.requestedTrip)

  const [trip, setTrip] = useState(requestedTrip)
  const [isLoading, setIsLoading] = useState(!requestedTrip)
  const [driverLocation, setDriverLocation] = useState(null)
  const [tripPhase, setTripPhase] = useState(requestedTrip ? "enroute" : "loading")

  useEffect(() => {
    if (requestedTrip) {
      setTrip(requestedTrip)
      setIsLoading(false)
      setTripPhase("enroute")
      return
    }

    if (!accountId) {
      setIsLoading(false)
      setTripPhase("notrip")
      return
    }

    const fetchTrip = async () => {
      try {
        const activeTrip = await getActiveTripByAccountId(accountId)
        if (activeTrip) {
          setTrip(activeTrip)
          setTripPhase("enroute")
        } else {
          setTripPhase("notrip")
        }
      } catch (_err) {
        setTripPhase("notrip")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [accountId, requestedTrip])

  const pathCoordinates = useMemo(() => {
    if (!trip) return []

    const pickup = trip.pickup?.location
    const destination = trip.destination?.location

    if (!pickup || !destination) return []

    if (trip.route?.polylineCoordinates?.length > 1) {
      return trip.route.polylineCoordinates.map((c) => ({
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
      }))
    }

    return [
      { latitude: Number(pickup.latitude), longitude: Number(pickup.longitude) },
      { latitude: Number(destination.latitude), longitude: Number(destination.longitude) },
    ]
  }, [trip])

  useEffect(() => {
    if (tripPhase !== "enroute" || pathCoordinates.length < 2) return

    setDriverLocation(pathCoordinates[0])
    startTimeRef.current = Date.now()

    animationRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTimeRef.current
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1)

      setDriverLocation(interpolateAlongPath(pathCoordinates, progress))

      if (progress >= 1) {
        clearInterval(animationRef.current)
        animationRef.current = null
        setTripPhase("finalized")

        if (trip?.id) {
          try {
            await updateTripStatus(trip.id, "finalized")
          } catch (_) {}
        }

        dispatch(cacheRequestedTrip(null))

        setTimeout(() => {
          navigation.replace("RequestTrip")
        }, 2000)
      }
    }, TICK_INTERVAL)

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
        animationRef.current = null
      }
    }
  }, [tripPhase, pathCoordinates, trip, dispatch, navigation])

  useEffect(() => {
    if (!mapRef.current || !trip?.pickup?.location || !trip?.destination?.location) return

    mapRef.current.fitToCoordinates(
      [trip.pickup.location, trip.destination.location],
      { edgePadding: MAP_EDGE_PADDING, animated: true }
    )
  }, [trip])

  if (isLoading) {
    return (
      <LoadingScreen loadingText={t("currentTripLoading")} />
    )
  }

  if (tripPhase === "notrip" || !trip) {
    return (
      <SafeAreaView style={commonStyles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={commonStyles.content} showsVerticalScrollIndicator={false}>
          <HeaderRow title={t("screenCurrentTrip")} />
          <View style={commonStyles.centeredState}>
            <Text style={commonStyles.loadingText}>{t("currentTripNoTrip")}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const mapRegion = trip.pickup?.location
    ? {
        latitude: Number(trip.pickup.location.latitude),
        longitude: Number(trip.pickup.location.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : FALLBACK_REGION

  return (
    <SafeAreaView style={commonStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={commonStyles.content} showsVerticalScrollIndicator={false}>
        <HeaderRow title={t("screenCurrentTrip")} />

        <View
          style={[
            styles.statusCard,
            tripPhase === "finalized" && styles.statusCardFinalized,
          ]}
        >
          <Text style={styles.statusText}>
            {tripPhase === "finalized"
              ? t("currentTripFinalized")
              : t("currentTripDriverEnRoute")}
          </Text>
        </View>

        <View style={commonStyles.mapCard}>
          <MapView
            ref={mapRef}
            style={commonStyles.map}
            initialRegion={mapRegion}
            showsUserLocation
          >
            {trip.pickup?.location ? (
              <Marker
                coordinate={{
                  latitude: Number(trip.pickup.location.latitude),
                  longitude: Number(trip.pickup.location.longitude),
                }}
                title={t("pickupLabel")}
                pinColor={theme.colors.accent}
              />
            ) : null}

            {trip.destination?.location ? (
              <Marker
                coordinate={{
                  latitude: Number(trip.destination.location.latitude),
                  longitude: Number(trip.destination.location.longitude),
                }}
                title={t("destinationLabel")}
                pinColor={theme.colors.danger}
              />
            ) : null}

            {driverLocation ? (
              <Marker
                coordinate={driverLocation}
                title={t("currentTripDriver")}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.driverIconBadge}>
                  <Image source={require("../assets/carIcon.png")} style={styles.driverIcon} />
                </View>
              </Marker>
            ) : null}

            {pathCoordinates.length > 1 ? (
              <Polyline
                coordinates={pathCoordinates}
                strokeColor={theme.colors.info}
                strokeWidth={5}
                geodesic
              />
            ) : null}
          </MapView>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("pickupLabel")}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {trip.pickup?.address ?? "-"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("destinationLabel")}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {trip.destination?.address ?? "-"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("tripCategoryLabel")}</Text>
            <Text style={styles.infoValue}>{trip.category ?? "-"}</Text>
          </View>

          {trip.estimate?.distanceText ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("estimateDistance")}</Text>
                <Text style={styles.infoValue}>{trip.estimate.distanceText}</Text>
              </View>
            </>
          ) : null}

          {trip.estimate?.durationText ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("estimateEta")}</Text>
                <Text style={styles.infoValue}>{trip.estimate.durationText}</Text>
              </View>
            </>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("estimateFare")}</Text>
            <Text style={styles.infoTotal}>
              {trip.estimate?.fare?.total ? formatCopCurrency(trip.estimate.fare.total, language) : "-"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  statusCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  statusCardFinalized: {
    backgroundColor: theme.colors.primary,
  },
  statusText: {
    fontSize: theme.typography.size.bodyLg,
    lineHeight: theme.typography.lineHeight.bodyLg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.surface,
  },
  driverIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  driverIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  infoLabel: {
    ...theme.text.body,
    minWidth: 90,
  },
  infoValue: {
    ...theme.text.bodyStrong,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
    flex: 1,
    textAlign: "right",
  },
  infoTotal: {
    ...theme.text.bodyStrong,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.divider,
  },
})

export default CurrentTripScreen