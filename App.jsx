import "./global.css"
import { NavigationContainer } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import TabNavigator from "./src/navigation/TabNavigator"
import { AccountProvider } from "./src/context/AccountContext"
import { LanguageProvider } from "./src/context/LanguageContext"
import { Provider } from "react-redux"
import { store } from "./src/store"
import theme from "./src/styles/theme"

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AccountProvider>
          <LanguageProvider>
            <NavigationContainer theme={theme.navigation}>
              <TabNavigator />
            </NavigationContainer>
          </LanguageProvider>
        </AccountProvider>
      </Provider>
    </SafeAreaProvider>
  )
}
