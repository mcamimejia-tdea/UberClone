import {
  ActivityIndicator,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import commonStyles from "../styles/commonStyles"
import theme from "../styles/theme"
import { useLanguage } from "../context/LanguageContext"

function LoadingScreen({loadingText}) {
    const { t } = useLanguage()

    return (
        <SafeAreaView style={commonStyles.container} edges={["top"]}>
            <View style={commonStyles.centeredState}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={commonStyles.loadingText}>{loadingText || t("loading")}</Text>
            </View>
        </SafeAreaView>
    )
}

export default LoadingScreen;