import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../services/supabaseClient";
import BackButton from "../../components/BackButton";
import CustomInput from "../../components/CustomInput";
import { Button } from "../../components/Button";
import { useNavigation } from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../@types/routes";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Calendar, Eye, EyeOff } from "lucide-react-native";
import { H4 } from "@components/Typography";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nome obrigatório" }),
  email: z.string().email({ message: "E-mail inválido" }),
  cpf: z.string().min(11, { message: "CPF obrigatório" }),
  birth: z.string().min(8, { message: "Data obrigatória" }),
  phone: z.string().min(8, { message: "Telefone obrigatório" }),
  password: z
    .string()
    .min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

type Props = NativeStackScreenProps<any, "SignUpScreen">;

export const SignUpScreen = ({ navigation }: Props) => {
  function handleLogin() {
    navigation.navigate("SignInScreen");
  }

  const [tab, setTab] = useState<"CPF" | "CNPJ">("CPF");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Funções auxiliares para formatação de data
  function formatDate(date: Date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function stringToDate(dateString: string) {
    const [day, month, year] = dateString.split("/");
    if (!day || !month || !year) return new Date();
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Função para formatar CPF
  function formatCPF(value: string) {
    let cleaned = value.replace(/\D/g, "");
    cleaned = cleaned.slice(0, 11);
    cleaned = cleaned.replace(/(\d{3})(\d)/, "$1.$2");
    cleaned = cleaned.replace(/(\d{3})(\d)/, "$1.$2");
    cleaned = cleaned.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return cleaned;
  }

  // Função para formatar CNPJ
  function formatCNPJ(value: string) {
    let cleaned = value.replace(/\D/g, "").slice(0, 14);
    let formatted = "";
    if (cleaned.length > 0) formatted = cleaned.slice(0, 2);
    if (cleaned.length >= 3) formatted += "." + cleaned.slice(2, 5);
    if (cleaned.length >= 6) formatted += "." + cleaned.slice(5, 8);
    if (cleaned.length >= 9) formatted += "/" + cleaned.slice(8, 12);
    if (cleaned.length >= 13) formatted += "-" + cleaned.slice(12, 14);
    return formatted;
  }

  // Função para formatar telefone
  function formatPhone(value: string) {
    let cleaned = value.replace(/\D/g, "");
    cleaned = cleaned.slice(0, 11);
    if (cleaned.length <= 10) {
      cleaned = cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
      cleaned = cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }
    return cleaned.trim().replace(/[- ]$/, "");
  }

  const onSubmit = async (data: RegisterFormData) => {
    // Aqui você pode adaptar para enviar os outros campos ao backend
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Cadastro realizado! Verifique seu e-mail.");
      navigation.navigate("SignInScreen");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton />
          <Text style={styles.title}>Inscrever-se</Text>
          <Text style={styles.subtitle}>Crie uma conta para continuar!</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, tab === "CPF" && styles.tabActive]}
              onPress={() => setTab("CPF")}
            >
              <Text
                style={[styles.tabText, tab === "CPF" && styles.tabTextActive]}
              >
                CPF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "CNPJ" && styles.tabActive]}
              onPress={() => setTab("CNPJ")}
            >
              <Text
                style={[styles.tabText, tab === "CNPJ" && styles.tabTextActive]}
              >
                CNPJ
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Nome completo</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nome completo"
                  autoCapitalize="words"
                />
              )}
            />
            {errors.name && (
              <Text style={styles.error}>{errors.name.message}</Text>
            )}

            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Digite seu e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text style={styles.error}>{errors.email.message}</Text>
            )}

            <Text style={styles.label}>{tab === "CPF" ? "CPF" : "CNPJ"}</Text>
            <Controller
              control={control}
              name="cpf"
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  value={value}
                  onChangeText={(text) =>
                    onChange(tab === "CPF" ? formatCPF(text) : formatCNPJ(text))
                  }
                  placeholder={
                    tab === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"
                  }
                  keyboardType="numeric"
                />
              )}
            />
            {errors.cpf && (
              <Text style={styles.error}>{errors.cpf.message}</Text>
            )}

            <Text style={styles.label}>Data de nascimento</Text>
            <Controller
              control={control}
              name="birth"
              render={({ field: { onChange, value } }) => {
                // Função para formatar a data enquanto digita (DD/MM/AAAA)
                const handleDateInput = (text: string) => {
                  let cleaned = text.replace(/\D/g, "");
                  if (cleaned.length > 2 && cleaned.length <= 4) {
                    cleaned = cleaned.replace(/(\d{2})(\d+)/, "$1/$2");
                  } else if (cleaned.length > 4) {
                    cleaned = cleaned.replace(
                      /(\d{2})(\d{2})(\d{1,4})/,
                      "$1/$2/$3",
                    );
                  }
                  onChange(cleaned);
                };
                return (
                  <>
                    <CustomInput
                      value={value}
                      onChangeText={handleDateInput}
                      placeholder="DD/MM/AAAA"
                      keyboardType="numeric"
                      rightIcon={
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(true)}
                          activeOpacity={0.7}
                          style={{ padding: 2 }}
                        >
                          <Calendar size={22} color="#888" />
                        </TouchableOpacity>
                      }
                    />
                    <DateTimePickerModal
                      isVisible={showDatePicker}
                      mode="date"
                      date={value ? stringToDate(value) : new Date()}
                      maximumDate={new Date()}
                      onConfirm={(date) => {
                        setShowDatePicker(false);
                        const formatted = formatDate(date);
                        onChange(formatted);
                      }}
                      onCancel={() => setShowDatePicker(false)}
                      locale="pt-BR"
                      cancelTextIOS="Cancelar"
                      confirmTextIOS="Confirmar"
                    />
                  </>
                );
              }}
            />
            {errors.birth && (
              <Text style={styles.error}>{errors.birth.message}</Text>
            )}

            <Text style={styles.label}>Número de telefone</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  value={value}
                  onChangeText={(text) => onChange(formatPhone(text))}
                  placeholder="(+55) 11 99999-9999"
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.phone && (
              <Text style={styles.error}>{errors.phone.message}</Text>
            )}

            <Text style={styles.label}>Definir senha</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Digite aqui sua senha"
                  secureTextEntry={!showPassword}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff size={24} color="#888" />
                      ) : (
                        <Eye size={24} color="#888" />
                      )}
                    </TouchableOpacity>
                  }
                />
              )}
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password.message}</Text>
            )}

            <Button
              style={styles.registerButton}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              <Text style={styles.registerButtonText}>
                {isSubmitting ? "Registrando..." : "Registrar"}
              </Text>
            </Button>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <Button
              className="h-14 bg-[#192126]"
              variant="default"
              onPress={handleLogin}
            >
              <H4 className="text-grayscale-1">Log In</H4>
            </Button>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 32,
    marginTop: 10,
    marginBottom: 4,
    color: "#111",
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#666",
    marginBottom: 18,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F4F4F5",
    borderRadius: 10,
    marginBottom: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#F4F4F5",
  },
  tabActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
    color: "#888",
  },
  tabTextActive: {
    color: "#111",
  },
  label: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#666",
    marginBottom: 6,
    marginTop: 8,
  },
  error: {
    color: "red",
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 2,
  },
  registerButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  footerText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#888",
  },
  loginLink: {
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
    color: "#BBF246",
  },
});
