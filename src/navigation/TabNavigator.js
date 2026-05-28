import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { FontAwesomeFreeSolid as Icon } from "@react-native-vector-icons/fontawesome-free-solid/static"
import StackNavigator from "./StackNavigator"
import ActivityScreen from "../screens/ActivityScreen"
import AccountScreen from "../screens/AccountScreen"
import { useLanguage } from "../context/LanguageContext"
import theme from "../styles/theme"

const Tab = createBottomTabNavigator()

export default function TabNavigator() {
  const { t } = useLanguage()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.size.caption,
          fontWeight: theme.typography.weight.medium,
        },
      }}
    >
      <Tab.Screen
        name="RequestTripTab"
        component={StackNavigator}
        options={{ title: t("navRequestTrip"), tabBarIcon: ({ color, size }) => <Icon name="car" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{ title: t("navActivity"), tabBarIcon: ({ color, size }) => <Icon name="history" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{ title: t("navAccount"), tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  )
}