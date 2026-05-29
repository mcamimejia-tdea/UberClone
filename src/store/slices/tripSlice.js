import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import {
  fetchDirectionsRoute,
  fetchDistanceMatrixEstimate,
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
} from "../../services/GoogleMapsService"
import { calculateEstimatedFare } from "../../constants/fareConfig"

const INITIAL_STATE = {
  currentLocation: null,
  pickupQuery: "",
  destinationQuery: "",
  pickupPredictions: [],
  destinationPredictions: [],
  pickupPlace: null,
  destinationPlace: null,
  selectedCategory: "Economy",
  route: null,
  estimate: null,
  requestedTrip: null,
  isLocationLoading: false,
  isAutocompleteLoading: false,
  isEstimateLoading: false,
  autocompleteField: null,
  error: null,
}

const buildFallbackRoute = ({ origin, destination }) => ({
  polylineCoordinates: [origin, destination],
  distanceMeters: null,
  durationSeconds: null,
  distanceText: null,
  durationText: null,
})

export const fetchPlaceSuggestions = createAsyncThunk(
  "trip/fetchPlaceSuggestions",
  async ({ field, query, language, currentLocation }, { rejectWithValue }) => {
    if (!query?.trim() || query.trim().length < 2) {
      return { field, predictions: [] }
    }

    try {
      const predictions = await fetchPlaceAutocomplete({
        query: query.trim(),
        language,
        currentLocation,
      })

      return { field, predictions }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const resolveSuggestion = createAsyncThunk(
  "trip/resolveSuggestion",
  async ({ field, placeId, language }, { rejectWithValue }) => {
    try {
      const place = await fetchPlaceDetails({ placeId, language })
      return { field, place }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchRouteEstimate = createAsyncThunk(
  "trip/fetchRouteEstimate",
  async ({ origin, destination, language, category }, { rejectWithValue }) => {
    try {
      let directionsRoute = null
      let matrixEstimate = null

      try {
        directionsRoute = await fetchDirectionsRoute({ origin, destination, language })
      } catch (_directionsError) {
        directionsRoute = null
      }

      try {
        matrixEstimate = await fetchDistanceMatrixEstimate({ origin, destination, language })
      } catch (_matrixError) {
        matrixEstimate = null
      }

      if (!directionsRoute && !matrixEstimate) {
        throw new Error("ROUTE_ESTIMATE_UNAVAILABLE")
      }

      const distanceMeters = matrixEstimate?.distanceMeters ?? directionsRoute?.distanceMeters
      const durationSeconds = matrixEstimate?.durationSeconds ?? directionsRoute?.durationSeconds

      const route =
        directionsRoute?.polylineCoordinates?.length > 1
          ? directionsRoute
          : buildFallbackRoute({ origin, destination })

      const estimate = {
        category,
        distanceMeters,
        durationSeconds,
        distanceText: matrixEstimate?.distanceText ?? directionsRoute?.distanceText,
        durationText: matrixEstimate?.durationText ?? directionsRoute?.durationText,
        fare:
          distanceMeters != null && durationSeconds != null
            ? calculateEstimatedFare({
                distanceMeters,
                durationSeconds,
                category,
              })
            : null,
      }

      return {
        route,
        estimate,
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const tripSlice = createSlice({
  name: "trip",
  initialState: INITIAL_STATE,
  reducers: {
    setQuery: (state, action) => {
      const { field, value } = action.payload

      if (field === "pickup") {
        state.pickupQuery = value

        if (!value.trim()) {
          state.pickupPlace = null
          state.route = null
          state.estimate = null
        }
      }

      if (field === "destination") {
        state.destinationQuery = value

        if (!value.trim()) {
          state.destinationPlace = null
          state.route = null
          state.estimate = null
        }
      }
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload
    },
    setLocationLoading: (state, action) => {
      state.isLocationLoading = action.payload
    },
    setPickupFromCurrentLocation: (state, action) => {
      state.pickupPlace = {
        placeId: null,
        title: action.payload.title,
        address: action.payload.address,
        location: action.payload.location,
      }
      state.pickupQuery = action.payload.address
    },
    clearPredictions: (state, action) => {
      if (action.payload === "pickup") {
        state.pickupPredictions = []
      }

      if (action.payload === "destination") {
        state.destinationPredictions = []
      }
    },
    clearError: (state) => {
      state.error = null
    },
    cacheRequestedTrip: (state, action) => {
      state.requestedTrip = action.payload
    },
    resetTripPlanner: (state) => {
      state.destinationQuery = ""
      state.destinationPredictions = []
      state.destinationPlace = null
      state.route = null
      state.estimate = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlaceSuggestions.pending, (state, action) => {
        state.isAutocompleteLoading = true
        state.autocompleteField = action.meta.arg.field
      })
      .addCase(fetchPlaceSuggestions.fulfilled, (state, action) => {
        state.isAutocompleteLoading = false
        state.autocompleteField = null

        if (action.payload.field === "pickup") {
          state.pickupPredictions = action.payload.predictions
        }

        if (action.payload.field === "destination") {
          state.destinationPredictions = action.payload.predictions
        }
      })
      .addCase(fetchPlaceSuggestions.rejected, (state, action) => {
        state.isAutocompleteLoading = false
        state.autocompleteField = null
        state.error = action.payload || action.error.message
      })
      .addCase(resolveSuggestion.pending, (state) => {
        state.error = null
      })
      .addCase(resolveSuggestion.fulfilled, (state, action) => {
        const { field, place } = action.payload

        if (field === "pickup") {
          state.pickupPlace = place
          state.pickupQuery = place.address
          state.pickupPredictions = []
        }

        if (field === "destination") {
          state.destinationPlace = place
          state.destinationQuery = place.address
          state.destinationPredictions = []
        }
      })
      .addCase(resolveSuggestion.rejected, (state, action) => {
        state.error = action.payload || action.error.message
      })
      .addCase(fetchRouteEstimate.pending, (state) => {
        state.isEstimateLoading = true
        state.error = null
      })
      .addCase(fetchRouteEstimate.fulfilled, (state, action) => {
        state.isEstimateLoading = false
        state.route = action.payload.route
        state.estimate = action.payload.estimate
      })
      .addCase(fetchRouteEstimate.rejected, (state, action) => {
        state.isEstimateLoading = false
        state.route = null
        state.estimate = null
        state.error = action.payload || action.error.message
      })
  },
})

export const {
  cacheRequestedTrip,
  clearError,
  clearPredictions,
  resetTripPlanner,
  setCurrentLocation,
  setLocationLoading,
  setPickupFromCurrentLocation,
  setQuery,
  setSelectedCategory,
} = tripSlice.actions

export default tripSlice.reducer
