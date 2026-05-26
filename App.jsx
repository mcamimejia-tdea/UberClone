import "./global.css"
import { NavigationContainer } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import TabNavigator from "./src/navigation/TabNavigator"
import theme from "./src/styles/theme"

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme.navigation}>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
