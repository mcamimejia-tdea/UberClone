import {
    Pressable,
    Text,
    View,
} from "react-native"
import commonStyles from "../styles/commonStyles"

function ActionRow({ saveText, handleSave, cancelText, handleCancel, disabled }) {
    return (
        <View style={commonStyles.actionRow}>
            {cancelText && handleCancel ? (
                <Pressable
                    style={[commonStyles.actionButton, commonStyles.cancelButton]}
                    onPress={handleCancel}
                >
                    <Text style={commonStyles.cancelButtonText}>{cancelText}</Text>
                </Pressable>
            ) : null}

            <Pressable
                style={[commonStyles.actionButton, commonStyles.saveButton, disabled ? commonStyles.disabledButton : null]}
                onPress={handleSave}
                disabled={disabled}
            >
                <Text style={commonStyles.saveButtonText}>{saveText}</Text>
            </Pressable>
        </View>
    );
}

export default ActionRow;