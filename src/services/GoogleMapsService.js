import axios from "axios"
import polyline from "@mapbox/polyline"
import { GOOGLE_MAPS_API_KEY } from "@env"

const GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api"
const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place"

export const API_KEY_MISSING_MESSAGE =
  "Missing Google Maps API key. Add GOOGLE_MAPS_API_KEY to your local env."

const assertApiKey = () => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(API_KEY_MISSING_MESSAGE)
  }
}

const toLatLngValue = ({ latitude, longitude }) => `${latitude},${longitude}`

export const fetchPlaceAutocomplete = async ({
  query,
  language,
  currentLocation,
}) => {
  assertApiKey()

  const params = {
    key: GOOGLE_MAPS_API_KEY,
    input: query,
    language,
  }

  if (currentLocation) {
    params.location = toLatLngValue(currentLocation)
    params.radius = 25000
  }

  const { data } = await axios.get(
    `${GOOGLE_PLACES_BASE_URL}/autocomplete/json`,
    { params }
  )

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || data.status)
  }

  return data.predictions.map((prediction) => ({
    id: prediction.place_id,
    placeId: prediction.place_id,
    title: prediction.structured_formatting?.main_text ?? prediction.description,
    subtitle: prediction.structured_formatting?.secondary_text ?? "",
    fullText: prediction.description,
  }))
}

export const fetchPlaceDetails = async ({ placeId, language }) => {
  assertApiKey()

  const { data } = await axios.get(
    `${GOOGLE_PLACES_BASE_URL}/details/json`,
    {
      params: {
        key: GOOGLE_MAPS_API_KEY,
        place_id: placeId,
        fields: "name,formatted_address,geometry",
        language,
      },
    }
  )

  if (data.status !== "OK" || !data.result?.geometry?.location) {
    throw new Error(data.error_message || data.status)
  }

  return {
    placeId,
    title: data.result.name,
    address: data.result.formatted_address,
    location: {
      latitude: data.result.geometry.location.lat,
      longitude: data.result.geometry.location.lng,
    },
  }
}

export const fetchDirectionsRoute = async ({ origin, destination, language }) => {
  assertApiKey()

  const { data } = await axios.get(`${GOOGLE_MAPS_BASE_URL}/directions/json`, {
    params: {
      key: GOOGLE_MAPS_API_KEY,
      origin: toLatLngValue(origin),
      destination: toLatLngValue(destination),
      language,
      mode: "driving",
    },
  })

  if (data.status !== "OK" || data.routes.length === 0) {
    throw new Error(data.error_message || data.status)
  }

  const firstRoute = data.routes[0]
  const firstLeg = firstRoute.legs[0]

  return {
    polylineCoordinates: polyline
      .decode(firstRoute.overview_polyline.points)
      .map(([latitude, longitude]) => ({ latitude, longitude })),
    distanceMeters: firstLeg.distance.value,
    durationSeconds: firstLeg.duration.value,
    distanceText: firstLeg.distance.text,
    durationText: firstLeg.duration.text,
  }
}

export const fetchDistanceMatrixEstimate = async ({
  origin,
  destination,
  language,
}) => {
  assertApiKey()

  const { data } = await axios.get(`${GOOGLE_MAPS_BASE_URL}/distancematrix/json`, {
    params: {
      key: GOOGLE_MAPS_API_KEY,
      origins: toLatLngValue(origin),
      destinations: toLatLngValue(destination),
      language,
      mode: "driving",
      departure_time: "now",
    },
  })

  if (data.status !== "OK") {
    throw new Error(data.error_message || data.status)
  }

  const element = data.rows?.[0]?.elements?.[0]

  if (!element || element.status !== "OK") {
    throw new Error(element?.status || "NO_ROUTE")
  }

  return {
    distanceMeters: element.distance.value,
    durationSeconds: element.duration.value,
    distanceText: element.distance.text,
    durationText: element.duration.text,
  }
}
