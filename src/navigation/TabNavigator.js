import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import Icon from "@react-native-vector-icons/fontawesome-free-solid"
import StackNavigator from "./StackNavigator"
import ActivityScreen from "../screens/ActivityScreen"
import AccountScreen from "../screens/AccountScreen"

const Tab = createBottomTabNavigator()

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="RequestTripTab"
        component={StackNavigator}
        options={{ title: "Request Trip", tabBarIcon: ({ color, size }) => <Icon name="car" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{ title: "Activity", tabBarIcon: ({ color, size }) => <Icon name="history" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{ title: "Account", tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  )
}