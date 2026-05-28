import { createStackNavigator } from "@react-navigation/stack"
import RequestTripScreen from "../screens/RequestTripScreen"
import CurrentTripScreen from "../screens/CurrentTripScreen"
import PaymentScreen from "../screens/PaymentScreen"
import { useLanguage } from "../context/LanguageContext"

const Stack = createStackNavigator()

export default function StackNavigator() {
  const { t } = useLanguage()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="RequestTrip"
        component={RequestTripScreen}
        options={{ title: t("navRequestTrip") }}
      />
      <Stack.Screen
        name="CurrentTrip"
        component={CurrentTripScreen}
        options={{ title: t("screenCurrentTrip") }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: t("screenPayment") }}
      />
    </Stack.Navigator>
  )
}