import { Image, ScrollView, View, StyleSheet, Text } from "react-native";

import LogoIcon from "@assets/icon.png";
import {
  Radar,
  MapPin,
  QrCode,
  Network,
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
          <View className="">
            <Image
              source={LogoIcon}
              className="mb-6 h-20 w-20 self-start"
              resizeMode="contain"
            />
            <Text style={styles.title}>Boas vindas ao Movt</Text>
            <Text style={styles.subtitle}>
              Explore o melhor do mundo fitness com profissionais
              especializados.
            </Text>
            <View className="gap-6">
              <Text style={styles.subtitle}>Veja como funciona:</Text>
              <View className="flex-row gap-4">
                <MapPin size={30} color="#111" />
                <View className="flex-1 gap-1 overflow-hidden">
                  <H4 className="text-grayscale-600">
                    Encontre personal trainers
                  </H4>
                  <P className="text-sm text-grayscale-500">
                    Veja treinadores perto de você com base na localização de
                    forma eficiente.
                  </P>
                </View>
              </View>
              <View className="flex-row gap-4">
                <QrCode size={30} color="#111" />
                <View className="flex-1 gap-1 overflow-hidden">
                  <H4 className="text-grayscale-600">
                    Integração com empresas parceiras
                  </H4>
                  <P className="text-sm text-grayscale-500">
                    Encontre academias parceiras nas proximidades que oferecem
                    benefícios.
                  </P>
                </View>
              </View>
              <View className="flex-row gap-4">
                <Network size={30} color="#111" />
                <View className="flex-1 gap-1 overflow-hidden">
                  <H4 className="text-grayscale-600">
                    Tecnologia a favor do usuário
                  </H4>
                  <P className="text-sm text-grayscale-500">
                    Oferecemos soluções tecnológicas para gerenciamento de
                    métricas e resultados.
                  </P>
                </View>
              </View>
              <View className="flex-row gap-4">
                <Radar size={30} color="#111" />
                <View className="flex-1 gap-1 overflow-hidden">
                  <H4 className="text-grayscale-600">
                    Tecnologia a favor do usuário
                  </H4>
                  <P className="text-sm text-grayscale-500">
                    Oferecemos soluções tecnológicas para gerenciamento de
                    métricas e resultados.
                  </P>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        <View
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            bottom: 30,
          }}
        >
          <Button
            className="h-14 bg-[#192126]"
            variant="default"
            onPress={handleStart}
          >
            <H4 className="text-grayscale-1">Começar</H4>
          </Button>
        </View>
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
});
