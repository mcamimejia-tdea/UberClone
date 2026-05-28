import "./global.css"
import { NavigationContainer } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import TabNavigator from "./src/navigation/TabNavigator"
import { AccountProvider } from "./src/context/AccountContext"
import theme from "./src/styles/theme"

export default function App() {
  return (
    <SafeAreaProvider>
      <AccountProvider>
        <NavigationContainer theme={theme.navigation}>
          <TabNavigator />
        </NavigationContainer>
      </AccountProvider>
    </SafeAreaProvider>
  )
}
