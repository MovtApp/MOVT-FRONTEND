import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "@components/BackButton";
import { FooterVersion } from "@components/FooterVersion";

const TermsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Termos e Condições</Text>
        <View style={{ width: 46 }} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdate}>Última atualização: 07 de junho de 2025</Text>

        <Text style={styles.sectionText}>
          {
            'Bem-vindo ao MOVT APP, um aplicativo que conecta usuários a treinadores pessoais por meio de geolocalização e facilita o gerenciamento de sessões de treino. Ao acessar ou usar o Movt App ("Aplicativo"), você concorda em cumprir e estar vinculado a estes Termos e Condições ("Termos"). Se você não concordar com estes Termos, por favor, não utilize o Aplicativo. Estes Termos são temporários e podem ser atualizados para uma versão definitiva no futuro.'
          }
        </Text>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
          <Text style={styles.sectionText}>
            Ao criar uma conta, acessar ou usar o Aplicativo, você declara que tem pelo menos 18
            anos ou a idade legal em sua jurisdição para celebrar contratos vinculantes. Menores de
            idade devem ter o consentimento de um responsável legal para usar o Aplicativo. Você
            também concorda em fornecer informações verdadeiras, precisas e completas durante o
            registro.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Descrição do Serviço</Text>
          <Text style={styles.sectionText}>O Movt App permite:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Localizar treinadores pessoais próximos por meio de geolocalização.
            </Text>
            <Text style={styles.bulletItem}>
              • Criar e gerenciar perfis de usuário e treinador.
            </Text>
            <Text style={styles.bulletItem}>
              • Agendar, reagendar ou cancelar sessões de treino.
            </Text>
            <Text style={styles.bulletItem}>
              • Comunicar-se com treinadores via mensagens no Aplicativo.
            </Text>
            <Text style={styles.bulletItem}>
              • Avaliar e fornecer feedback sobre treinadores e sessões.
            </Text>
          </View>
          <Text style={styles.sectionText}>
            O Aplicativo atua como uma plataforma de conexão e não é responsável pelas interações ou
            serviços prestados pelos treinadores.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Regras de Uso</Text>
          <Text style={styles.sectionText}>
            Você concorda em usar o Aplicativo de forma lícita e respeitosa, comprometendo-se a:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Não utilizar o Aplicativo para atividades ilegais, fraudulentas ou não autorizadas.
            </Text>
            <Text style={styles.bulletItem}>
              • Não compartilhar conteúdo ofensivo, difamatório ou que viole direitos de terceiros.
            </Text>
            <Text style={styles.bulletItem}>
              • Não tentar acessar, modificar ou interferir nos sistemas do Aplicativo.
            </Text>
            <Text style={styles.bulletItem}>
              • Fornecer informações precisas em seu perfil e durante o uso.
            </Text>
          </View>
          <Text style={styles.sectionText}>
            Os treinadores devem possuir qualificações válidas e fornecer informações verdadeiras
            sobre suas certificações e serviços.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Contas de Usuário</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Registro: Você deve criar uma conta com e-mail, redes sociais ou outro método de
              autenticação. Sua senha deve ser mantida confidencial.
            </Text>
            <Text style={styles.bulletItem}>
              • Responsabilidade: Você é responsável por todas as atividades realizadas em sua
              conta.
            </Text>
            <Text style={styles.bulletItem}>
              • Encerramento: Podemos suspender ou encerrar sua conta se você violar estes Termos ou
              se sua conduta prejudicar outros usuários ou o Aplicativo.
            </Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Geolocalização</Text>
          <Text style={styles.sectionText}>
            O Aplicativo utiliza serviços de geolocalização para conectar usuários a treinadores
            próximos. Ao ativar essa funcionalidade, você consente com a coleta e uso de dados de
            localização, conforme descrito na Política de Privacidade.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Pagamentos e Contratações</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • As sessões de treino são contratadas diretamente entre usuários e treinadores. O
              Aplicativo não intermedia pagamentos, a menos que especificado em atualizações
              futuras.
            </Text>
            <Text style={styles.bulletItem}>
              • Qualquer disputa relacionada a pagamentos ou serviços deve ser resolvida diretamente
              entre o usuário e o treinador.
            </Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Propriedade Intelectual</Text>
          <Text style={styles.sectionText}>
            Todo o conteúdo do Aplicativo, incluindo design, logotipos, textos e software, é
            propriedade do MOVT App ou de seus licenciadores e está protegido por leis de
            propriedade intelectual. Você não pode copiar, modificar ou distribuir esse conteúdo sem
            autorização.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitação de Responsabilidade</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • O MOVT App não garante a qualidade, segurança ou legalidade dos serviços prestados
              pelos treinadores.
            </Text>
            <Text style={styles.bulletItem}>
              • Não nos responsabilizamos por danos diretos, indiretos, incidentais ou
              consequenciais decorrentes do uso do Aplicativo, salvo quando exigido por lei.
            </Text>
            <Text style={styles.bulletItem}>
              {'• O Aplicativo é fornecido "como está", sem garantias implícitas ou explícitas.'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Modificações nos Termos</Text>
          <Text style={styles.sectionText}>
            Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações
            serão comunicadas por e-mail ou notificação no Aplicativo e entrarão em vigor
            imediatamente após a publicação. O uso continuado do Aplicativo após as alterações
            implica aceitação dos novos Termos.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Rescisão</Text>
          <Text style={styles.sectionText}>
            Você pode encerrar sua conta a qualquer momento entrando em contato conosco. Podemos
            rescindir seu acesso ao Aplicativo por violação destes Termos ou por qualquer motivo,
            com ou sem notificação prévia.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Lei Aplicável</Text>
          <Text style={styles.sectionText}>
            Estes Termos são regidos pelas leis da República do Brasil. Qualquer disputa será
            resolvida nos tribunais competentes da cidade de São Paulo, SP, salvo disposição legal
            em contrário.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contato</Text>
          <Text style={styles.sectionText}>
            Para dúvidas ou suporte, entre em contato conosco em:{"\n"}
            E-mail: comercial.movtapp@gmail.com{"\n"}
            Telefone: (11) 99999-9999{"\n"}
            Endereço: [definir]
          </Text>
        </View>

        {/* Footer */}
        <FooterVersion />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: "#192126",
    fontFamily: "Rubik_700Bold",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 0,
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  lastUpdate: {
    fontSize: 18,
    color: "#192126",
    fontFamily: "Rubik_700Bold",
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#192126",
    fontFamily: "Rubik_700Bold",
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: "#111",
    fontFamily: "Rubik_400Regular",
    lineHeight: 20,
  },
  bulletList: {
    marginVertical: 5,
    paddingLeft: 5,
  },
  bulletItem: {
    fontSize: 14,
    color: "#111",
    fontFamily: "Rubik_400Regular",
    lineHeight: 20,
    marginBottom: 5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 20,
  },
});
