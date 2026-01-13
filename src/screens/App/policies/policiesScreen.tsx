import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "@components/BackButton";
import MVLogo from "@assets/MV.png";

const PoliciesScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>Políticas de privacidade</Text>
                <View style={{ width: 46 }} />
            </View>
            <View style={styles.headerDivider} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.lastUpdate}>Última atualização: 07 de junho de 2025</Text>

                <Text style={styles.sectionText}>
                    O Movt App ("Aplicativo") valoriza sua privacidade e está comprometido em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações, em conformidade com a Lei Geral de Proteção de Dados (LGPD) (Lei nº 13.709/2018). Esta é uma versão temporária, sujeita a alterações definitivas conforme o desenvolvimento do Aplicativo.
                </Text>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Dados que Coletamos</Text>
                    <Text style={styles.sectionText}>Coletamos os seguintes tipos de dados pessoais para fornecer e melhorar nossos serviços:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Dados de Registro: Nome, e-mail, número de telefone, senha e, opcionalmente, informações de redes sociais usadas para autenticação.</Text>
                        <Text style={styles.bulletItem}>• Dados de Perfil:</Text>
                        <View style={styles.nestedBulletList}>
                            <Text style={styles.bulletItem}>• Usuários: Metas de fitness, preferências de treino, histórico de sessões.</Text>
                            <Text style={styles.bulletItem}>• Treinadores: Certificações, especialidades, avaliações de clientes, informações de contato.</Text>
                        </View>
                        <Text style={styles.bulletItem}>• Dados de Geolocalização: Localização precisa ou aproximada, coletada quando você ativa a funcionalidade de geolocalização.</Text>
                        <Text style={styles.bulletItem}>• Dados de Uso: Informações sobre como você interage com o Aplicativo, como páginas visitadas, tempo de uso e erros encontrados.</Text>
                        <Text style={styles.bulletItem}>• Dados de Comunicação: Mensagens trocadas entre usuários e treinadores no sistema de chat do Aplicativo.</Text>
                        <Text style={styles.bulletItem}>• Dados de Feedback: Avaliações e comentários sobre sessões ou treinadores.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Como Coletamos os Dados</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Diretamente de você: Quando você se registra, cria um perfil, agenda sessões ou envia mensagens.</Text>
                        <Text style={styles.bulletItem}>• Automaticamente: Por meio de cookies, logs do servidor e tecnologias de rastreamento (ex.: geolocalização, quando habilitada).</Text>
                        <Text style={styles.bulletItem}>• De terceiros: Quando você faz login com redes sociais ou outras plataformas de autenticação, com seu consentimento.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Finalidade do Uso dos Dados</Text>
                    <Text style={styles.sectionText}>Usamos seus dados para:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Criar e gerenciar sua conta.</Text>
                        <Text style={styles.bulletItem}>• Conectar você a treinadores próximos via geolocalização.</Text>
                        <Text style={styles.bulletItem}>• Facilitar o agendamento e a comunicação com treinadores.</Text>
                        <Text style={styles.bulletItem}>• Personalizar sua experiência no Aplicativo.</Text>
                        <Text style={styles.bulletItem}>• Melhorar o desempenho e a funcionalidade do Aplicativo.</Text>
                        <Text style={styles.bulletItem}>• Cumprir obrigações legais e resolver disputas.</Text>
                        <Text style={styles.bulletItem}>• Enviar notificações e lembretes relacionados ao uso do Aplicativo.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Compartilhamento de Dados</Text>
                    <Text style={styles.sectionText}>Seus dados podem ser compartilhados:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Com treinadores: Informações do seu perfil (ex.: nome, metas de fitness) são compartilhadas com treinadores para facilitar a contratação e o agendamento.</Text>
                        <Text style={styles.bulletItem}>• Com provedores de serviços: Parceiros que nos auxiliam em funções como hospedagem, análise de dados e suporte técnico, sempre sob contratos que garantam a proteção dos dados.</Text>
                        <Text style={styles.bulletItem}>• Por obrigação legal: Quando exigido por lei, ordem judicial ou autoridade competente.</Text>
                        <Text style={styles.bulletItem}>• Não vendemos ou alugamos seus dados pessoais a terceiros para fins de marketing.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Proteção dos Dados</Text>
                    <Text style={styles.sectionText}>Implementamos medidas de segurança, como:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Criptografia de dados em trânsito e em repouso.</Text>
                        <Text style={styles.bulletItem}>• Controles de acesso para proteger contra acessos não autorizados.</Text>
                        <Text style={styles.bulletItem}>• Auditorias regulares de segurança. Apesar disso, nenhum sistema é 100% seguro, e não podemos garantir proteção absoluta contra violações.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Armazenamento e Retenção</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Seus dados são armazenados em servidores seguros localizados no Brasil ou em outros países que atendam aos padrões da LGPD.</Text>
                        <Text style={styles.bulletItem}>• Retemos seus dados pelo tempo necessário para cumprir as finalidades descritas ou conforme exigido por lei. Após isso, os dados são anonimizados ou excluídos.</Text>
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Seus Direitos</Text>
                    <Text style={styles.sectionText}>De acordo com a LGPD, você tem os seguintes direitos:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Acesso: Solicitar uma cópia dos dados que temos sobre você.</Text>
                        <Text style={styles.bulletItem}>• Correção: Corrigir dados imprecisos ou incompletos.</Text>
                        <Text style={styles.bulletItem}>• Exclusão: Solicitar a exclusão de seus dados, salvo quando exigido por lei.</Text>
                        <Text style={styles.bulletItem}>• Portabilidade: Receber seus dados em formato estruturado.</Text>
                        <Text style={styles.bulletItem}>• Revogação de consentimento: Retirar seu consentimento para o processamento de dados, quando aplicável.</Text>
                        <Text style={styles.bulletItem}>• Oposição: Opor-se ao uso de seus dados para certas finalidades, como marketing.</Text>
                    </View>
                    <Text style={styles.sectionText}>
                        Para exercer esses direitos, entre em contato conosco em movtapp@comercial.com.
                    </Text>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Cookies e Tecnologias de Rastreamento</Text>
                    <Text style={styles.sectionText}>
                        Usamos cookies e tecnologias similares para melhorar a funcionalidade e analisar o uso do Aplicativo. Você pode gerenciar suas preferências de cookies nas configurações do seu dispositivo ou navegador.
                    </Text>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>9. Transferências Internacionais</Text>
                    <Text style={styles.sectionText}>
                        Seus dados podem ser transferidos para outros países (ex.: onde estão localizados nossos servidores ou provedores). Garantimos que essas transferências sigam as exigências da LGPD e incluam salvaguardas adequadas.
                    </Text>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>10. Menores de Idade</Text>
                    <Text style={styles.sectionText}>
                        O Aplicativo não é destinado a menores de 18 anos sem o consentimento de um responsável legal. Se tomarmos conhecimento de que coletamos dados de menores sem autorização, excluiremos essas informações imediatamente.
                    </Text>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>11. Alterações nesta Política</Text>
                    <Text style={styles.sectionText}>
                        Podemos atualizar esta Política de Privacidade para refletir mudanças no Aplicativo, na legislação ou nas nossas práticas. Notificaremos você por e-mail ou no Aplicativo sobre alterações significativas. O uso continuado do Aplicativo após as mudanças implica aceitação da nova Política.
                    </Text>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>12. Contato</Text>
                    <Text style={styles.sectionText}>
                        Para dúvidas, solicitações ou reclamações sobre privacidade, entre em contato com nosso Encarregado de Proteção de Dados (DPO):{"\n"}{"\n"}
                        E-mail: comercial.movtapp@comercial.com{"\n"}
                        Telefone: (11) 99999-9999{"\n"}
                        Endereço: [definir]
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Image source={MVLogo} style={styles.logoImage} resizeMode="contain" />
                    <Text style={styles.versionText}>Versão 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PoliciesScreen;

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
    nestedBulletList: {
        paddingLeft: 15,
        marginVertical: 5,
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
    footer: {
        alignItems: "flex-start",
        marginTop: 50,
    },
    logoImage: {
        width: 50,
        height: 25,
        marginBottom: 4,
    },
    versionText: {
        fontSize: 14,
        color: "#192126",
        fontFamily: "Rubik_400Regular",
        opacity: 0.8,
    },
});
