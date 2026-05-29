import { Text, TextInput, View } from "react-native"
import commonStyles from "../styles/commonStyles"

function FieldGroupText({ label, isEditMode, value, onChangeText, placeholder, placeholderTextColor, displayValue, ...textInputProps }) {
  return (
    <View style={commonStyles.fieldGroup}>
      <Text style={commonStyles.label}>{label}</Text>
      {isEditMode ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          style={commonStyles.input}
          {...textInputProps}
        />
      ) : (
        <Text style={commonStyles.valueText}>{displayValue}</Text>
      )}
    </View>
  )
}

export default FieldGroupText
