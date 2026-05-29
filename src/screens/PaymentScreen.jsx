import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import InAppBrowser from "react-native-inappbrowser-reborn"
import { useDispatch, useSelector } from "react-redux"
import ActionRow from "../components/ActionRow"
import HeaderRow from "../components/HeaderRow"
import { useLanguage } from "../context/LanguageContext"
import {
  createCheckoutProPreference,
} from "../services/MercadoPagoService"
import { getTripById, updateTripPayment } from "../services/TripService"
import { cacheRequestedTrip } from "../store/slices/tripSlice"
import { formatCopCurrency } from "../utils/currency"
import commonStyles from "../styles/commonStyles"
import theme from "../styles/theme"

const resolvePaymentStatusFromDeepLink = (deepLink) => {
  if (!deepLink) {
    return null
  }

  const normalizedLink = String(deepLink)

  if (normalizedLink.includes("payment/success")) {
    return "approved"
  }

  if (normalizedLink.includes("payment/pending")) {
    return "pending"
  }

  if (normalizedLink.includes("payment/failure")) {
    return "rejected"
  }

  return null
}

function PaymentScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const { t, language } = useLanguage()
  const requestedTrip = useSelector((state) => state.trip.requestedTrip)

  const tripId = route?.params?.tripId ?? null
  const [trip, setTrip] = useState(
    requestedTrip?.id && requestedTrip.id === tripId ? requestedTrip : null
  )
  const [isTripLoading, setIsTripLoading] = useState(!trip)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const handledPaymentRef = useRef(false)
  const deepLinkListenerRef = useRef(null)

  const fareTotal = useMemo(() => Number(trip?.estimate?.fare?.total ?? 0), [trip])
  const canStartPayment = Boolean(tripId && fareTotal > 0 && !isCheckoutLoading)

  useEffect(() => {
    if (!tripId) {
      Alert.alert(t("alertErrorTitle"), t("paymentMissingTrip"))
      navigation.replace("RequestTrip")
      return
    }

    if (trip?.id === tripId) {
      setIsTripLoading(false)
      return
    }

    const loadTrip = async () => {
      setIsTripLoading(true)

      try {
        const loadedTrip = await getTripById(tripId)

        if (!loadedTrip) {
          Alert.alert(t("alertErrorTitle"), t("paymentMissingTrip"))
          navigation.replace("RequestTrip")
          return
        }

        setTrip(loadedTrip)
      } catch (_) {
        Alert.alert(t("alertErrorTitle"), t("alertTripLoadError"))
        navigation.replace("RequestTrip")
      } finally {
        setIsTripLoading(false)
      }
    }

    loadTrip()
  }, [tripId, trip, navigation, t])

  const handlePaymentOutcome = useCallback(
    async ({ status, deepLink }) => {
      if (!tripId || !trip || handledPaymentRef.current) {
        return
      }

      handledPaymentRef.current = true

      let paymentId = null

      try {
        const parsed = new URL(deepLink)
        paymentId = parsed.searchParams.get("payment_id")
      } catch (_) {
        paymentId = null
      }

      try {
        await updateTripPayment(tripId, {
          status,
          amount: fareTotal,
          paymentId,
          updatedAt: new Date().toISOString(),
        })
      } catch (_) {
        Alert.alert(t("alertErrorTitle"), t("paymentSaveError"))
        handledPaymentRef.current = false
        setIsCheckoutLoading(false)
        return
      }

      if (status === "approved") {
        const nextTrip = {
          ...trip,
          payment: {
            status,
            amount: fareTotal,
            paymentId,
            updatedAt: new Date().toISOString(),
          },
        }

        dispatch(cacheRequestedTrip(nextTrip))
        setIsCheckoutLoading(false)
        navigation.replace("CurrentTrip", { tripId })
        return
      }

      setIsCheckoutLoading(false)

      if (status === "pending") {
        Alert.alert(t("paymentPendingTitle"), t("paymentPendingMessage"))
      } else {
        Alert.alert(t("paymentRejectedTitle"), t("paymentRejectedMessage"))
      }

      handledPaymentRef.current = false
    },
    [dispatch, fareTotal, navigation, t, trip, tripId]
  )

  // Setup deep link listener when component mounts
  useEffect(() => {
    const setupDeepLinkListener = async () => {
      deepLinkListenerRef.current = Linking.addEventListener("url", (event) => {
        const { url } = event
        console.log("[PaymentScreen] Deep link received:", url)

        const status = resolvePaymentStatusFromDeepLink(url)
        if (status) {
          handlePaymentOutcome({ status, deepLink: url })
        }
      })
    }

    setupDeepLinkListener()

    return () => {
      if (deepLinkListenerRef.current) {
        deepLinkListenerRef.current.remove()
      }
    }
  }, [handlePaymentOutcome])

  const handleOpenCheckout = useCallback(async () => {
    if (!canStartPayment || !tripId || !trip) {
      return
    }

    setIsCheckoutLoading(true)
    handledPaymentRef.current = false

    try {
      const response = await createCheckoutProPreference({
        tripId,
        amount: fareTotal,
        description: `${t("requestTripTitle")} - ${trip.category ?? t("tripCategoryLabel")}`,
      })

      const checkoutUrl = response.initPoint || response.sandboxInitPoint

      if (!checkoutUrl) {
        throw new Error("MERCADO_PAGO_INIT_POINT_MISSING")
      }

      console.log("[PaymentScreen] Opening checkout URL:", checkoutUrl)

      const available = await InAppBrowser.isAvailable()
      console.log("[PaymentScreen] InAppBrowser available:", available)

      if (available) {
        InAppBrowser.open(checkoutUrl, {
          // iOS Properties
          dismissButtonStyle: "cancel",
          preferredBarTintColor: theme.colors.primary,
          preferredControlTintColor: "white",
          readerMode: false,
          animated: true,
          modalEnabled: true,
          // Android Properties
          showTitle: true,
          toolbarColor: theme.colors.primary,
          secondaryToolbarColor: theme.colors.surface,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          forceCloseOnRedirection: false,
          animations: {
            startEnter: "slide_in_right",
            startExit: "slide_out_left",
            endEnter: "slide_in_left",
            endExit: "slide_out_right",
          },
        })
      } else {
        Linking.openURL(checkoutUrl)
      }
    } catch (e) {
      console.error("[PaymentScreen] Checkout error:", e)
      const errorMessage = e?.message || t("paymentStartError")
      Alert.alert(t("alertErrorTitle"), errorMessage)
      setIsCheckoutLoading(false)
      handledPaymentRef.current = false
    }
  }, [canStartPayment, fareTotal, t, tripId, trip])

  if (isTripLoading) {
    return (
      <LoadingScreen loadingText={t("currentTripLoading")} />
    )
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={commonStyles.content} showsVerticalScrollIndicator={false}>
        <HeaderRow title={t("screenPayment")} />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t("paymentSummaryTitle")}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("tripCategoryLabel")}</Text>
            <Text style={styles.summaryValue}>{trip?.category ?? "-"}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("estimateDistance")}</Text>
            <Text style={styles.summaryValue}>{trip?.estimate?.distanceText ?? "-"}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("estimateEta")}</Text>
            <Text style={styles.summaryValue}>{trip?.estimate?.durationText ?? "-"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("paymentTotalLabel")}</Text>
            <Text style={styles.summaryTotal}>
              {fareTotal > 0 ? formatCopCurrency(fareTotal, language) : "-"}
            </Text>
          </View>
        </View>

        <View style={commonStyles.alertCard}>
          <Text style={commonStyles.alertText}>{t("paymentDisclaimer")}</Text>
        </View>

        <ActionRow
          saveText={isCheckoutLoading ? t("paymentLoadingCheckout") : t("paymentStartButton")}
          handleSave={handleOpenCheckout}
          cancelText={t("cancel")}
          handleCancel={() => navigation.goBack()}
          disabled={!canStartPayment || isCheckoutLoading}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  summaryCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  summaryTitle: {
    ...theme.text.subtitle,
    fontSize: theme.typography.size.bodyLg,
    lineHeight: theme.typography.lineHeight.bodyLg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  summaryLabel: {
    ...theme.text.body,
  },
  summaryValue: {
    ...theme.text.bodyStrong,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  summaryTotal: {
    ...theme.text.bodyStrong,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
    marginVertical: theme.spacing.xs,
  },
})

export default PaymentScreen