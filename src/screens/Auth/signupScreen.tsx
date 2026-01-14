import { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/services/api";
import BackButton from "@/components/BackButton";
import CustomInput from "@/components/CustomInput";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Calendar, Eye, EyeOff } from "lucide-react-native";
import { useForm, Controller, ControllerRenderProps } from "react-hook-form";

const registerSchema = z.object({
  nome: z.string().min(2, { message: "Nome obrigatório" }),
  email: z.string().email({ message: "E-mail inválido" }),
  cpf_cnpj: z.string().min(11, { message: "Documento obrigatório" }), // Para CPF ou CNPJ
  data_nascimento: z.string().min(8, { message: "Data de nascimento obrigatória" }),
  telefone: z.string().min(12, { message: "Telefone obrigatório" }),
  senha: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface Props {
  navigation: {
    navigate: (screen: string) => void;
  };
}

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
    try {
      const response = await api.post("/register", {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        cpf_cnpj: data.cpf_cnpj,
        data_nascimento: data.data_nascimento,
        telefone: data.telefone,
        tipo_documento: tab,
      });

      if (response.status === 201) {
        Alert.alert("Sucesso", response.data.message);
        navigation.navigate("SignInScreen");
      } else {
        Alert.alert("Erro", response.data.error || "Ocorreu um erro desconhecido.");
      }
    } catch (error: any) {
      console.error("Erro ao registrar usuário:", error);
      Alert.alert(
        "Erro no Cadastro",
        error.response?.data?.error || "Não foi possível conectar ao servidor."
      );
    }
  };

  function handleSignIn() {
    navigation.navigate("SignInScreen");
  }

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
              <Text style={[styles.tabText, tab === "CPF" && styles.tabTextActive]}>CPF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "CNPJ" && styles.tabActive]}
              onPress={() => setTab("CNPJ")}
            >
              <Text style={[styles.tabText, tab === "CNPJ" && styles.tabTextActive]}>CNPJ</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Nome completo</Text>
            <Controller
              control={control}
              name="nome"
              render={({ field }: { field: ControllerRenderProps<RegisterFormData, "nome"> }) => (
                <CustomInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Nome completo"
                  autoCapitalize="none"
                  spellCheck={false} // Adicionado explicitamente
                />
              )}
            />
            {errors.nome && <Text style={styles.error}>{errors.nome.message}</Text>}

            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field }: { field: ControllerRenderProps<RegisterFormData, "email"> }) => (
                <CustomInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Digite seu e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

            <Text style={styles.label}>{tab === "CPF" ? "CPF" : "CNPJ"}</Text>
            <Controller
              control={control}
              name="cpf_cnpj"
              render={({
                field,
              }: {
                field: ControllerRenderProps<RegisterFormData, "cpf_cnpj">;
              }) => (
                <CustomInput
                  value={field.value}
                  onChangeText={(text: string) =>
                    field.onChange(tab === "CPF" ? formatCPF(text) : formatCNPJ(text))
                  }
                  placeholder={tab === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.cpf_cnpj && <Text style={styles.error}>{errors.cpf_cnpj.message}</Text>}

            <Text style={styles.label}>Data de nascimento</Text>
            <Controller
              control={control}
              name="data_nascimento"
              render={({
                field,
              }: {
                field: ControllerRenderProps<RegisterFormData, "data_nascimento">;
              }) => {
                const handleDateInput = (text: string) => {
                  let cleaned = text.replace(/\D/g, "");
                  if (cleaned.length > 2 && cleaned.length <= 4) {
                    cleaned = cleaned.replace(/(\d{2})(\d+)/, "$1/$2");
                  } else if (cleaned.length > 4) {
                    cleaned = cleaned.replace(/(\d{2})(\d{2})(\d{1,4})/g, "$1/$2/$3");
                  }
                  field.onChange(cleaned);
                };
                return (
                  <>
                    <CustomInput
                      value={field.value}
                      onChangeText={handleDateInput}
                      placeholder="DD/MM/AAAA"
                      keyboardType="numeric"
                      rightIcon={
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(true)}
                          activeOpacity={0.7}
                          style={{ padding: 2, paddingRight: 40 }}
                        >
                          <Calendar size={22} color="#888" />
                        </TouchableOpacity>
                      }
                    />
                    <DateTimePickerModal
                      isVisible={showDatePicker}
                      mode="date"
                      date={field.value ? stringToDate(field.value) : new Date()}
                      maximumDate={new Date()}
                      onConfirm={(date: Date) => {
                        setShowDatePicker(false);
                        const formatted = formatDate(date);
                        field.onChange(formatted);
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
            {errors.data_nascimento && (
              <Text style={styles.error}>{errors.data_nascimento.message}</Text>
            )}

            <Text style={styles.label}>Número de telefone</Text>
            <Controller
              control={control}
              name="telefone"
              render={({
                field,
              }: {
                field: ControllerRenderProps<RegisterFormData, "telefone">;
              }) => (
                <CustomInput
                  value={field.value}
                  onChangeText={(text: string) => field.onChange(formatPhone(text))}
                  placeholder="(+55) 11 99999-9999"
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.telefone && <Text style={styles.error}>{errors.telefone.message}</Text>}

            <Text style={styles.label}>Definir senha</Text>
            <Controller
              control={control}
              name="senha"
              render={({ field }: { field: ControllerRenderProps<RegisterFormData, "senha"> }) => (
                <CustomInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Digite aqui sua senha"
                  secureTextEntry={!showPassword}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={{ padding: 2, paddingRight: 40 }}
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
            {errors.senha && <Text style={styles.error}>{errors.senha.message}</Text>}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              <Text style={styles.registerButtonText}>
                {isSubmitting ? "Registrando..." : "Registrar"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.signIn}> Log In</Text>
            </TouchableOpacity>
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
    paddingTop: 20,
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
    backgroundColor: "#192126",
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
  signIn: {
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
    color: "#BBF246",
  },
});
