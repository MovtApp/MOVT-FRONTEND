import React from "react";
import { TextInput, View, StyleSheet, Text } from "react-native";
import { COLORS } from "../styles/colors";

/**
 * Componente de input customizado e reutilizável.
 */
interface CustomInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  spellCheck?: boolean; // Adicionado
  /**
   * Ícone opcional exibido à esquerda do input.
   */
  leftIcon?: React.ReactNode;
  /**
   * Ícone opcional exibido à direita do input. Exemplo: botão de exibir/esconder senha.
   */
  rightIcon?: React.ReactNode;
  /**
   * Limita o número máximo de caracteres permitidos no input.
   */
  maxLength?: number;
  /**
   * Função chamada quando o input recebe foco.
   */
  onFocus?: () => void;
  /**
   * Função chamada quando o input perde foco.
   */
  onBlur?: () => void;
  /**
   * Função chamada quando o botão de submit é pressionado (apenas para single line).
   */
  onSubmitEditing?: () => void;
  /**
   * Texto do botão de submit (apenas para single line).
   */
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  /**
   * Estilo customizado para o container.
   */
  containerStyle?: any;
  /**
   * Estilo customizado para o input.
   */
  inputStyle?: any;
  /**
   * Se deve mostrar o contador de caracteres.
   */
  showCharacterCount?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  maxLength,
  onFocus,
  onBlur,
  onSubmitEditing,
  returnKeyType = "done",
  containerStyle,
  inputStyle,
  showCharacterCount = false,
  spellCheck = false, // Adicionado e definido como false por padrão
}) => {
  const hasError = !!error;
  const isMultiline = multiline && numberOfLines > 1;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, hasError && styles.labelError]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          hasError && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
          isMultiline && styles.inputContainerMultiline,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            isMultiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.grayscale[45]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={isMultiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          spellCheck={spellCheck} // Passado para o TextInput
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {(error || showCharacterCount) && (
        <View style={styles.bottomRow}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {showCharacterCount && maxLength && (
            <Text style={styles.characterCount}>
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.grayscale[80],
    marginBottom: 8,
    fontFamily: "Rubik_500Medium",
  },
  labelError: {
    color: "#EF4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayscale[20],
    borderRadius: 10,
    backgroundColor: COLORS.grayscale[0],
    minHeight: 48,
  },
  inputContainerError: {
    borderColor: "#EF4444",
  },
  inputContainerDisabled: {
    backgroundColor: COLORS.grayscale[5],
    opacity: 0.6,
  },
  inputContainerMultiline: {
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 12,
  },
  leftIcon: {
    paddingLeft: 16,
    paddingRight: 8,
    justifyContent: "center",
    alignItems: "center",
    height: 24,
    width: 24,
  },
  rightIcon: {
    paddingRight: 16,
    paddingLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    height: 24,
    width: 24,
  },
  input: {
    flex: 1,
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: COLORS.grayscale[100],
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  inputMultiline: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Rubik_400Regular",
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.grayscale[45],
    fontFamily: "Rubik_400Regular",
  },
});

export default CustomInput;
