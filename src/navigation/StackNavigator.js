import { createStackNavigator } from "@react-navigation/stack"
import RequestTripScreen from "../screens/RequestTripScreen"
import CurrentTripScreen from "../screens/CurrentTripScreen"
import PaymentScreen from "../screens/PaymentScreen"

const Stack = createStackNavigator()

export default function StackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RequestTrip"
        component={RequestTripScreen}
        options={{ title: "Request Trip" }}
      />
      <Stack.Screen
        name="CurrentTrip"
        component={CurrentTripScreen}
        options={{ title: "Current Trip" }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: "Payment" }}
      />
    </Stack.Navigator>
  )
}