import { TouchableOpacity, StyleSheet, Platform, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BackButtonProps = {
  to?: {
    name: string;
    params?: Record<string, unknown>;
  };
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  autoTopInset?: boolean;
};

const BackButton: React.FC<BackButtonProps> = ({ to, onPress, style, autoTopInset = false }) => {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const insets = useSafeAreaInsets();

  const dynamicStyle = Platform.OS === 'android' && autoTopInset
    ? { marginTop: insets.top > 0 ? insets.top + 20 : 40 }
    : {};

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (to?.name) {
      navigation.navigate(to.name, to.params || {});
      return;
    }

    navigation.goBack();
  };

  return (
    <TouchableOpacity style={[styles.button, dynamicStyle, style]} onPress={handlePress}>
      <Ionicons name="arrow-back" size={20} color="#fff" />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#192126",
    borderRadius: 12,
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
