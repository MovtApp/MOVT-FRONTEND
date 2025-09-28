import { Image, ScrollView, View, StyleSheet, Text, TouchableOpacity } from "react-native";

import LogoIcon from "@assets/icon.png";
import {
  Radar,
  MapPin,
  QrCode,
  Network,
  HeartPlus,
} from "lucide-react-native";
import { ContainerX } from "@components/ContainerX";
import { H4, P } from "@components/Typography";
import { Button } from "@components/Button";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, "StartupScreen">;

export const StartupScreen = ({ navigation }: Props) => {

  function handleStart() {
    navigation.navigate("SignInScreen");
  }
  return (
    <ContainerX>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 20,
            paddingHorizontal: 30,
            paddingBottom: 120,
          }}
        >
          <View>
            <Image
              source={LogoIcon}
              style={{ marginBottom: 24, height: 80, width: 80, alignSelf: "flex-start" }}
              resizeMode="contain"
            />
            <Text style={styles.title}>Boas vindas ao Movt</Text>
            <Text style={styles.subtitle}>
              Explore o melhor do mundo fitness com profissionais
              especializados.
            </Text>
            <View>
              <Text style={styles.subtitle}>Veja como funciona:</Text>
              <View style={{ flexDirection: "row", marginBottom: 24 }}>
                <View style={{ marginRight: 16 }}>
                  <MapPin size={30} color="#111" />
                </View>
                <View style={{ flex: 1, overflow: "hidden" }}>
                  <H4 style={{ fontFamily: "Rubik_700Bold" }}>
                    Encontre personal trainers
                  </H4>
                  <P style={{ color: "#666", fontFamily: "Rubik_400Regular" }}>
                    Veja treinadores perto de você com base na localização de
                    forma eficiente.
                  </P>
                </View>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 24 }}>
                <View style={{ marginRight: 16 }}>
                  <QrCode size={30} color="#111" />
                </View>
                <View style={{ flex: 1, overflow: "hidden" }}>
                  <H4 style={{ fontFamily: "Rubik_700Bold" }}>
                    Integração com empresas parceiras
                  </H4>
                  <P style={{ color: "#666", fontFamily: "Rubik_400Regular" }}>
                    Encontre academias parceiras nas proximidades que oferecem
                    benefícios.
                  </P>
                </View>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 24 }}>
                <View style={{ marginRight: 16 }}>
                  <Network size={30} color="#111" />
                </View>
                <View style={{ flex: 1, overflow: "hidden" }}>
                  <H4 style={{ fontFamily: "Rubik_700Bold" }}>
                    Tecnologia a favor do usuário
                  </H4>
                  <P style={{ color: "#666", fontFamily: "Rubik_400Regular" }}>
                    Oferecemos soluções tecnológicas para gerenciamento de
                    métricas e resultados.
                  </P>
                </View>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 24 }}>
                <View style={{ marginRight: 16 }}>
                  <HeartPlus size={30} color="#111" />
                </View>
                <View style={{ flex: 1, overflow: "hidden" }}>
                  <H4 style={{ fontFamily: "Rubik_700Bold" }}>
                    Saúde e bem-estar
                  </H4>
                  <P style={{ color: "#666", fontFamily: "Rubik_400Regular" }}>
                    Facilita o cuidado com a saúde, tornando o acompanhamento de treinos e hábitos mais prático e motivador.
                  </P>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
       
      <TouchableOpacity style={styles.advanceButton} onPress={handleStart}>
        <Text style={styles.advanceButtonText}>Começar</Text>
      </TouchableOpacity>
      </View>
    </ContainerX>
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
    marginTop: 20,
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
  error: {
    color: "red",
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 2,
  },
  forgot: {
    color: "#1877F3",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 18,
  },
  loginButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  separatorText: {
    marginHorizontal: 10,
    color: "#888",
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
  },
  noAccount: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    color: "#888",
  },
  signUp: {
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
    color: "#1877F3",
  },
  advanceButton: {
    width: 350,
    alignSelf: "center",
    backgroundColor: "#192126",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 30,
    marginTop: 30,
  },
  advanceButtonText: {
    color: "#fff",
    fontFamily: "Rubik_500Medium",
    fontSize: 16,
  },
});
