import axios from "axios"
import {
  MERCADO_PAGO_PUBLIC_KEY,
  MERCADO_PAGO_ACCESS_TOKEN,
} from "@env"

const MERCADO_PAGO_API_BASE_URL = "https://api.mercadopago.com"

export const MERCADO_PAGO_RETURN_URLS = {
  success: "uberclone://payment/success",
  failure: "uberclone://payment/failure",
  pending: "uberclone://payment/pending",
}

const assertMercadoPagoConfig = () => {
  if (!MERCADO_PAGO_PUBLIC_KEY || !MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Error(
      "Missing Mercado Pago keys. Add MERCADO_PAGO_PUBLIC_KEY and MERCADO_PAGO_ACCESS_TOKEN to your local env."
    )
  }
  console.log("[MercadoPagoService] Config verified. Keys loaded:", {
    publicKeyLength: MERCADO_PAGO_PUBLIC_KEY?.length ?? 0,
    accessTokenLength: MERCADO_PAGO_ACCESS_TOKEN?.length ?? 0,
  })
}

export const createCheckoutProPreference = async ({
  tripId,
  amount,
  description,
}) => {
  assertMercadoPagoConfig()

  const payload = {
    items: [
      {
        id: tripId,
        title: description,
        description,
        quantity: 1,
        currency_id: "COP",
        unit_price: Math.round(Number(amount)),
      },
    ],
    external_reference: tripId,
    back_urls: MERCADO_PAGO_RETURN_URLS,
    auto_return: "approved",
    binary_mode: true,
  }

  console.log("[MercadoPagoService] Creating preference with payload:", {
    amount,
    tripId,
    description,
    payloadKeys: Object.keys(payload),
  })

  try {
    const { data } = await axios.post(
      `${MERCADO_PAGO_API_BASE_URL}/checkout/preferences`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )

    console.log("[MercadoPagoService] Preference created successfully:", {
      preferenceId: data.id,
      initPoint: data.init_point ? "present" : "missing",
    })

    return {
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    }
  } catch (error) {
    console.error("[MercadoPagoService] API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      message: error.message,
    })
    throw error
  }
}