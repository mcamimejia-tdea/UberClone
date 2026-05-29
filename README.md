# UberClone (React Native)

Mobile Uber-style app built with React Native, Firestore, Google Maps APIs, and Mercado Pago Checkout Pro.

This app includes:

- Account profile creation and editing (with optional photo)
- Trip request flow with pickup/destination autocomplete
- Route and fare estimation by trip category
- Checkout and payment with Mercado Pago Checkout Pro
- Active trip simulation and trip history
- English/Spanish UI localization and COP currency formatting

## Features and Behavior

### Account tab

- Creates and updates an account in Firestore (`accounts` collection)
- Stores selected language (`English` or `Spanish`) and syncs app UI language
- Stores account id locally in AsyncStorage for session persistence
- Allows selecting a profile image from gallery (saved as base64 in Firestore)

### Request Trip tab

- Requests location permission and obtains current user location
- Uses Google Places Autocomplete for pickup and destination suggestions
- Resolves selected suggestions with Google Place Details
- Uses Google Directions and Distance Matrix to estimate route, distance, ETA, and fare
- Supports 3 categories:
	- Economy
	- XL
	- Premium
- Saves the trip in Firestore (`trips` collection) with `status: "active"`
- Navigates to Payment screen with the generated `tripId`

### Payment screen

- Loads trip by `tripId`
- Creates Mercado Pago Checkout Pro preference
- Opens checkout in-app browser (`react-native-inappbrowser-reborn`)
- Listens for deep link return URLs:
	- `uberclone://payment/success` -> approved
	- `uberclone://payment/pending` -> pending
	- `uberclone://payment/failure` -> rejected
- Saves payment status in Firestore under `trip.payment`
- If approved, routes to Current Trip screen

### Current Trip screen

- Displays pickup, destination, estimated metrics and total
- Draws route polyline on map
- Simulates moving driver along route for ~60 seconds
- Marks trip as `finalized` in Firestore when simulation ends
- Returns to Request Trip screen automatically

### Activity tab

- Loads account trips from Firestore
- Sorts trips by newest first (`createdAt` descending)
- Displays active/finalized badge, origin, destination, date, and total fare
- Supports pull-to-refresh

## Integrations

### Firebase / Firestore

- Firestore is used as the app data store
- Collections used:
	- `accounts`
	- `trips`
- Current Firebase project config is defined in `src/data/FirebaseConfig.js`

### Google Maps APIs

Used services:

- Places Autocomplete API
- Place Details API
- Directions API
- Distance Matrix API

Also used for maps and location in app:

- `react-native-maps`
- `react-native-geolocation-service`

Note: if Directions fails but Distance Matrix succeeds, the app still renders a fallback straight polyline between origin and destination.

### Mercado Pago Checkout Pro

- Creates checkout preference via Mercado Pago REST API
- Uses deep links to return payment result to the app
- Requires public key and access token in environment variables

## Tech Stack

- React Native `0.85.3`
- React `19.2.3`
- Redux Toolkit
- React Navigation (Bottom Tabs + Stack)
- Firebase Firestore
- Axios
- NativeWind/Tailwind setup available

## Project Structure

High-level folders:

- `src/screens`: screen-level UI and flows
- `src/services`: API and Firestore operations
- `src/store`: Redux store and trip slice
- `src/context`: account and language contexts
- `src/components`: reusable UI components
- `src/styles`: theme and shared styles
- `src/constants`: fare configuration

## Prerequisites

Before running:

- Node.js `>= 22.11.0`
- React Native environment configured for Android and/or iOS
- Android Studio (for Android)
- Xcode + CocoaPods (for iOS)
- A Firebase project with Firestore enabled
- Google Cloud project with required Maps APIs enabled
- Mercado Pago credentials (test or production)

## Environment Variables

Create `.env` in project root (copy from `.env.example`):

```bash
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID

GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
MERCADO_PAGO_PUBLIC_KEY=YOUR_MERCADO_PAGO_PUBLIC_KEY
MERCADO_PAGO_ACCESS_TOKEN=YOUR_MERCADO_PAGO_ACCESS_TOKEN
```

Notes:

- Firebase config is loaded from `.env` by `src/data/FirebaseConfig.js`.
- `GOOGLE_MAPS_API_KEY` is used by JS services and injected into Android manifest placeholder.
- Mercado Pago keys are required to create checkout preferences.

## Firebase Setup

1. Create/choose Firebase project.
2. Enable Cloud Firestore.
3. Add Firebase credentials to `.env`:
	- `FIREBASE_API_KEY`
	- `FIREBASE_AUTH_DOMAIN`
	- `FIREBASE_PROJECT_ID`
	- `FIREBASE_STORAGE_BUCKET`
	- `FIREBASE_MESSAGING_SENDER_ID`
	- `FIREBASE_APP_ID`
4. Ensure Firestore rules allow the operations used by this app (read/write `accounts` and `trips`).

## Google Maps Setup

1. In Google Cloud, enable:
	 - Places API
	 - Directions API
	 - Distance Matrix API
2. Add your API key to `.env` as `GOOGLE_MAPS_API_KEY`.
3. For Android map rendering, key is consumed through `AndroidManifest.xml` meta-data.

## Mercado Pago Setup

1. Create Mercado Pago application/credentials.
2. Add keys to `.env`:
	 - `MERCADO_PAGO_PUBLIC_KEY`
	 - `MERCADO_PAGO_ACCESS_TOKEN`
3. Deep links already configured in app for checkout return URLs using `uberclone://payment/...`.
4. Use Mercado Pago test credentials/cards for safe QA.

## Install and Run

### 1. Install dependencies

```bash
npm install
```

### 2. iOS only: install pods

```bash
bundle install
cd ios && bundle exec pod install
```

### 3. Start Metro

```bash
npm start
```

### 4. Run app

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

## Scripts

- `npm start`: start Metro
- `npm run android`: build/run Android app
- `npm run ios`: build/run iOS app
- `npm test`: run tests
- `npm run lint`: run ESLint
