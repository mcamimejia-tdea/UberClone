import { useState } from "react"
import { Pressable, Text, View } from "react-native"
import commonStyles from "../styles/commonStyles"

function FieldGroupSelect({ label, isEditMode, value, options, onSelect, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <View style={commonStyles.fieldGroup}>
      <Text style={commonStyles.label}>{label}</Text>
      {isEditMode ? (
        <View>
          <Pressable
            style={commonStyles.dropdownTrigger}
            onPress={() => setIsOpen((prev) => !prev)}
          >
            <Text style={value ? commonStyles.dropdownValueText : commonStyles.dropdownPlaceholderText}>
              {value ? selectedLabel : placeholder}
            </Text>
          </Pressable>

          {isOpen ? (
            <View style={commonStyles.dropdownList}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  style={commonStyles.dropdownOption}
                  onPress={() => {
                    onSelect(option.value)
                    setIsOpen(false)
                  }}
                >
                  <Text style={commonStyles.dropdownOptionText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={commonStyles.valueText}>{selectedLabel ?? value ?? "-"}</Text>
      )}
    </View>
  )
}

export default FieldGroupSelect
