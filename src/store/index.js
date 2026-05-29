import { configureStore } from "@reduxjs/toolkit"
import tripReducer from "./slices/tripSlice"

export const store = configureStore({
  reducer: {
    trip: tripReducer,
  },
})
