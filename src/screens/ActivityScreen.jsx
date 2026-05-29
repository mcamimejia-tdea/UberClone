import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import HeaderRow from "../components/HeaderRow"
import { useAccountContext } from "../context/AccountContext"
import { useLanguage } from "../context/LanguageContext"
import { getTripsByAccountId } from "../services/TripService"
import { formatCopCurrency } from "../utils/currency"
import commonStyles from "../styles/commonStyles"
import theme from "../styles/theme"
import LoadingScreen from "./LoadingScreen"

const formatTripDate = (createdAt, language) => {
  if (!createdAt) {
    return "-"
  }

  const parsedDate = new Date(createdAt)
  if (Number.isNaN(parsedDate.getTime())) {
    return "-"
  }

  const locale = language === "es" ? "es-CO" : "en-CO"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate)
}

function ActivityScreen() {
  const { accountId } = useAccountContext()
  const { t, language } = useLanguage()
  const [trips, setTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadTrips = useCallback(async ({ isManualRefresh = false } = {}) => {
    if (!accountId) {
      setTrips([])
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }

    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const accountTrips = await getTripsByAccountId(accountId)

      const sortedTrips = [...accountTrips].sort((a, b) => {
        const dateA = new Date(a.createdAt ?? 0).getTime()
        const dateB = new Date(b.createdAt ?? 0).getTime()

        return dateB - dateA
      })

      setTrips(sortedTrips)
    } catch (_error) {
      setTrips([])
      Alert.alert(t("alertErrorTitle"), t("alertTripLoadError"))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [accountId, t])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  const handleRefresh = useCallback(() => {
    loadTrips({ isManualRefresh: true })
  }, [loadTrips])

  const tripCards = useMemo(
    () =>
      trips.map((trip) => {
        const fareTotal = trip.estimate?.fare?.total
        const isActive = trip.status === "active"

        return (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("activityTrip")}</Text>
              <View
                style={[
                  styles.statusBadge,
                  isActive ? styles.statusActive : styles.statusFinalized,
                ]}
              >
                <Text style={styles.statusText}>
                  {isActive ? t("activityStatusActive") : t("activityStatusFinalized")}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("pickupLabel")}</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {trip.pickup?.address ?? "-"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("destinationLabel")}</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {trip.destination?.address ?? "-"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("activityTotalFare")}</Text>
              <Text style={styles.detailValue}>
                {typeof fareTotal === "number" ? formatCopCurrency(fareTotal, language) : "-"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("activityDate")}</Text>
              <Text style={styles.detailValue}>{formatTripDate(trip.createdAt, language)}</Text>
            </View>
          </View>
        )
      }),
    [language, t, trips]
  )

  if (isLoading) {
    return <LoadingScreen loadingText={t("activityLoading")} />
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={commonStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <HeaderRow title={t("navActivity")} />

        {!accountId ? (
          <View style={commonStyles.alertCard}>
            <Text style={commonStyles.alertText}>{t("loginToRequestTrip")}</Text>
          </View>
        ) : null}

        {accountId && trips.length === 0 ? (
          <View style={commonStyles.centeredState}>
            <Text style={commonStyles.loadingText}>{t("activityEmptyState")}</Text>
          </View>
        ) : null}

        {accountId && trips.length > 0 ? tripCards : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  tripCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  cardTitle: {
    ...theme.text.bodyStrong,
  },
  statusBadge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  statusActive: {
    backgroundColor: "#DCFCE7",
  },
  statusFinalized: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  statusText: {
    ...theme.text.caption,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weight.semibold,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  detailLabel: {
    ...theme.text.body,
    flex: 1,
  },
  detailValue: {
    ...theme.text.bodyStrong,
    flex: 1,
    textAlign: "right",
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
})

export default ActivityScreen