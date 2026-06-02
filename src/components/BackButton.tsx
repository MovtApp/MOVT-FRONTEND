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

// Telas que vivem DENTRO do Tab navigator "MainTabs" (ver App.routes.tsx).
// Navegar para elas pelo nome direto a partir do Stack pai falha com
// "NAVIGATE ... was not handled by any navigator"; é preciso rotear pelo
// "MainTabs" passando o screen aninhado. Mantido em sincronia com MAIN_TAB_SCREENS.
const MAIN_TAB_SCREENS = ["HomeScreen", "MapScreen", "DietScreen", "DataScreen", "ChatScreen"];

const BackButton: React.FC<BackButtonProps> = ({ to, onPress, style, autoTopInset = false }) => {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const insets = useSafeAreaInsets();

  const dynamicStyle = autoTopInset
    ? {
        marginTop:
          Platform.OS === "android"
            ? insets.top > 0
              ? insets.top + 20
              : 40
            : insets.top > 0
              ? insets.top
              : 20,
      }
    : {};

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (to?.name) {
      if (MAIN_TAB_SCREENS.includes(to.name)) {
        // Tela aninhada no Tab navigator: roteia pelo MainTabs.
        navigation.navigate("MainTabs" as never, { screen: to.name, params: to.params } as never);
      } else {
        navigation.navigate(to.name as never, (to.params || {}) as never);
      }
      return;
    }

    // Só volta se houver histórico. Em telas que são raiz do seu navigator
    // (ex.: Verify quando é a initialRoute), goBack() dispara o warning de dev
    // "The action 'GO_BACK' was not handled by any navigator". Telas que precisam
    // de um destino quando não há histórico devem passar `to` ou `onPress`.
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
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
