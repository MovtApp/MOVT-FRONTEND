import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { ChevronDown } from "lucide-react-native";

interface Option {
  label: string;
  value: string | null;
}

interface SelectInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  options: Option[];
}

const SelectInput: React.FC<SelectInputProps> = ({
  value,
  onChange,
  placeholder,
  options,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setModalVisible((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, !value && { color: "#888" }]}>
          {selectedLabel || placeholder}
        </Text>
        <View style={styles.iconContainer}>
          <ChevronDown size={24} color="#888" />
        </View>
      </TouchableOpacity>
      {modalVisible && (
        <View style={styles.dropdown}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value?.toString() || "default"}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onChange(item.value);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    fontFamily: "Rubik_400Regular",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
    position: "relative",
  },
  text: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#111",
  },
  iconContainer: {
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto", // Garante alinhamento à direita
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    width: "80%",
    maxHeight: 300,
    elevation: 5,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: "#111",
    fontFamily: "Rubik_400Regular",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: "100%",
    maxHeight: 300,
    elevation: 5,
    zIndex: 10,
    marginTop: 0, // Sem espaçamento extra
    position: "absolute",
    top: "100%",
    left: 0,
  },
});

export default SelectInput;
