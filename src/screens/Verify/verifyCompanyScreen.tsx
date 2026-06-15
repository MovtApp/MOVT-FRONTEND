import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import BackButton from "../../components/BackButton";
import CustomInput from "../../components/CustomInput";
import { VerifyStackParamList } from "../../@types/routes";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "@/services/api";
import { formatCNPJ, onlyDigits, isValidCNPJ } from "@/utils/cnpj";
import { CheckCircle2, Search } from "lucide-react-native";
import { useAuth } from "@contexts/AuthContext";

type Empresa = {
  razaoSocial: string | null;
  nomeFantasia: string | null;
  situacao: string;
  ativa: boolean;
};

type CnaeItem = { codigo: string; descricao: string; permitido: boolean };

const VerifyCompanyScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<VerifyStackParamList>>();
  const { user, updateUser } = useAuth();

  const [cnpj, setCnpj] = useState("");
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Busca de CNAE
  const [cnaeQuery, setCnaeQuery] = useState("");
  const [cnaeResults, setCnaeResults] = useState<CnaeItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCnae, setSelectedCnae] = useState<CnaeItem | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const validarEmpresa = async (rawCnpj: string) => {
    const digits = onlyDigits(rawCnpj);
    setLoadingCompany(true);
    setCompanyError(null);
    try {
      const { data } = await api.get(`/verify/cnpj/${digits}`);
      setEmpresa(data.data as Empresa);
    } catch (err: any) {
      setEmpresa(null);
      setCompanyError(
        err.response?.data?.error || "Não foi possível validar o CNPJ na Receita Federal."
      );
    } finally {
      setLoadingCompany(false);
    }
  };

  // 0) Empresa já validada (cnpj_verified persistido no backend): esta etapa não
  // pode retroceder. Pula direto para o CREF, sem reabrir a validação do CNPJ.
  useEffect(() => {
    if (user?.cnpj_verified) {
      navigation.reset({ index: 0, routes: [{ name: "VerifyCrefScreen" }] });
    }
  }, [user?.cnpj_verified, navigation]);

  // 1) Puxa o CNPJ já cadastrado no signup e valida na Receita.
  useEffect(() => {
    if (user?.cnpj_verified) return; // já validado → o effect 0 redireciona
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/user/session-status");
        const userCnpj: string | null = data?.user?.cnpj || null;
        if (!mounted) return;
        if (userCnpj) {
          setCnpj(formatCNPJ(userCnpj));
          await validarEmpresa(userCnpj);
        } else {
          setCompanyError("Nenhum CNPJ encontrado no seu cadastro.");
          setLoadingCompany(false);
        }
      } catch {
        if (mounted) {
          setCompanyError("Não foi possível carregar seus dados. Tente novamente.");
          setLoadingCompany(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 2) Busca de CNAE (por número ou nome), com debounce.
  useEffect(() => {
    const q = cnaeQuery.trim();
    if (q.length < 2) {
      setCnaeResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/cnae/search`, { params: { q } });
        setCnaeResults(data.results || []);
      } catch {
        setCnaeResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [cnaeQuery]);

  // 3) Confirma: salva CNPJ + CNAE e dispara a validação completa no backend.
  const handleVerify = async () => {
    const digits = onlyDigits(cnpj);
    if (!isValidCNPJ(digits)) {
      Alert.alert("CNPJ inválido", "O CNPJ do seu cadastro é inválido. Contate o suporte.");
      return;
    }
    if (!empresa?.ativa) {
      Alert.alert("Empresa inativa", companyError || "O CNPJ precisa estar ativo na Receita.");
      return;
    }
    if (!selectedCnae) {
      Alert.alert("Selecione o CNAE", "Busque e selecione o CNAE da sua atividade.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.put("/user/professional-data", {
        cnpj: digits,
        cnae: selectedCnae.codigo,
      });
      if (data?.pending) {
        // Revisão manual (provedores fora do ar): a empresa AINDA não foi validada,
        // então NÃO marcamos cnpj_verified. Segue para o CREF, mas o status fica
        // pendente até a aprovação no admin.
        Alert.alert("Em revisão", data.message, [
          {
            text: "Entendi",
            // reset: o CREF passa a ser a única rota da pilha Verify, impedindo
            // retroceder a esta tela.
            onPress: () => navigation.reset({ index: 0, routes: [{ name: "VerifyCrefScreen" }] }),
          },
        ]);
        return;
      }
      // Sucesso definitivo: o backend já gravou cnpj_verified=true. Refletimos no
      // estado local para que esta etapa não reabra (gate do Verify usa cnpj_verified).
      await updateUser({ cnpj_verified: true });
      // Etapa concluída: reseta a pilha para não permitir voltar a esta tela.
      navigation.reset({ index: 0, routes: [{ name: "VerifyCrefScreen" }] });
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err.response?.data?.error || "Não foi possível validar o CNPJ. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.topSection}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BackButton autoTopInset />
        <Text style={styles.title}>Validar sua empresa</Text>
        <Text style={styles.subtitle}>
          Confirmamos o CNPJ do seu cadastro na Receita Federal. Selecione o CNAE da sua atividade
          para concluir.
        </Text>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>CNPJ</Text>
          <CustomInput
            value={cnpj}
            onChangeText={() => {}}
            placeholder="00.000.000/0000-00"
            editable={false}
          />

          {/* Status da empresa na Receita */}
          {loadingCompany ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#192126" />
              <Text style={styles.statusText}>Consultando a Receita Federal…</Text>
            </View>
          ) : empresa ? (
            <View style={[styles.companyBox, empresa.ativa ? styles.companyOk : styles.companyBad]}>
              <Text style={styles.companyName}>{empresa.razaoSocial || "Empresa"}</Text>
              <Text style={[styles.companySit, empresa.ativa ? styles.sitOk : styles.sitBad]}>
                {empresa.situacao}
              </Text>
            </View>
          ) : (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{companyError}</Text>
              <TouchableOpacity onPress={() => validarEmpresa(cnpj)}>
                <Text style={styles.retry}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Busca de CNAE — só habilita com empresa ativa */}
        {empresa?.ativa && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>CNAE da atividade</Text>
            {selectedCnae ? (
              <TouchableOpacity
                style={styles.selectedCnae}
                onPress={() => {
                  setSelectedCnae(null);
                  setCnaeQuery("");
                }}
              >
                <CheckCircle2 size={18} color="#16A34A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedCnaeCode}>{formatCnaeCode(selectedCnae.codigo)}</Text>
                  <Text style={styles.selectedCnaeDesc}>{selectedCnae.descricao}</Text>
                </View>
                <Text style={styles.changeCnae}>Trocar</Text>
              </TouchableOpacity>
            ) : (
              <>
                <CustomInput
                  value={cnaeQuery}
                  onChangeText={setCnaeQuery}
                  placeholder="Busque por número ou nome do CNAE"
                  leftIcon={<Search size={18} color="#94A3B8" />}
                />
                {searching && <ActivityIndicator color="#192126" style={{ marginTop: 8 }} />}
                {cnaeResults.map((item) => (
                  <TouchableOpacity
                    key={item.codigo}
                    style={[styles.cnaeItem, !item.permitido && styles.cnaeItemDisabled]}
                    disabled={!item.permitido}
                    onPress={() => setSelectedCnae(item)}
                  >
                    <Text style={styles.cnaeCode}>{formatCnaeCode(item.codigo)}</Text>
                    <Text style={styles.cnaeDesc}>{item.descricao}</Text>
                    {!item.permitido && (
                      <Text style={styles.cnaeNotAllowed}>Não aceito para personal</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.verifyButton,
          (!empresa?.ativa || !selectedCnae || submitting) && { opacity: 0.5 },
        ]}
        onPress={handleVerify}
        disabled={!empresa?.ativa || !selectedCnae || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>Verificar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

/** 9313100 → 9313-1/00 (somente exibição). */
function formatCnaeCode(codigo: string): string {
  const c = (codigo || "").replace(/\D/g, "").padEnd(7, "0").slice(0, 7);
  return `${c.slice(0, 4)}-${c.slice(4, 5)}/${c.slice(5, 7)}`;
}

export default VerifyCompanyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topSection: {
    flex: 1,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 32,
    marginTop: 30,
    marginBottom: 4,
    color: "#111",
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    marginTop: 10,
    color: "#666",
    marginBottom: 8,
  },
  label: {
    fontFamily: "Rubik_500Medium",
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  statusText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: "#666",
  },
  companyBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  companyOk: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  companyBad: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  companyName: { fontFamily: "Rubik_600SemiBold", fontSize: 15, color: "#111" },
  companySit: { fontFamily: "Rubik_500Medium", fontSize: 12, marginTop: 4 },
  sitOk: { color: "#16A34A" },
  sitBad: { color: "#DC2626" },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  errorBoxText: { fontFamily: "Rubik_400Regular", fontSize: 14, color: "#B91C1C" },
  retry: { fontFamily: "Rubik_500Medium", fontSize: 14, color: "#192126", marginTop: 8 },
  cnaeItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cnaeItemDisabled: { opacity: 0.4 },
  cnaeCode: { fontFamily: "Rubik_600SemiBold", fontSize: 13, color: "#192126" },
  cnaeDesc: { fontFamily: "Rubik_400Regular", fontSize: 13, color: "#475569", marginTop: 2 },
  cnaeNotAllowed: { fontFamily: "Rubik_500Medium", fontSize: 11, color: "#DC2626", marginTop: 4 },
  selectedCnae: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  selectedCnaeCode: { fontFamily: "Rubik_600SemiBold", fontSize: 14, color: "#111" },
  selectedCnaeDesc: { fontFamily: "Rubik_400Regular", fontSize: 13, color: "#475569", marginTop: 2 },
  changeCnae: { fontFamily: "Rubik_500Medium", fontSize: 13, color: "#192126" },
  verifyButton: {
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 50,
    marginTop: 10,
  },
  verifyButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});
