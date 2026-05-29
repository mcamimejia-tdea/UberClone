import {
    Pressable,
    Text,
    View,
} from "react-native"
import commonStyles from "../styles/commonStyles"
import theme from "../styles/theme"

function HeaderRow({ title, actionText, onActionPress }) {
    return (
        <View style={commonStyles.headerRow}>
            <Text style={theme.text.title}>{title}</Text>
            {actionText && onActionPress ? (
                <Pressable style={commonStyles.editButton} onPress={onActionPress}>
                    <Text style={commonStyles.editButtonText}>{actionText}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

export default HeaderRow;