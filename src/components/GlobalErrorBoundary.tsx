import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { RefreshCcw, AlertTriangle } from "lucide-react-native";
import * as Updates from "expo-updates";
import * as Sentry from "@sentry/react-native";

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Reporta o erro para o Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    console.error("FATAL ERROR INTERCEPTED:", error, errorInfo);
  }

  handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      // Fallback se o Updates falhar
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color="#EF4444" />
            </View>

            <Text style={styles.title}>Ops! Algo deu errado.</Text>
            <Text style={styles.subtitle}>
              O aplicativo encontrou um erro inesperado e precisou ser interrompido.
            </Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Detalhes técnicos:</Text>
              <Text style={styles.errorText}>
                {this.state.error?.name}: {this.state.error?.message}
              </Text>
              {__DEV__ && (
                <Text style={styles.stackText}>{this.state.error?.stack?.slice(0, 500)}...</Text>
              )}
            </View>

            <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
              <RefreshCcw size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Reiniciar Aplicativo</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              Se o problema persistir, entre em contato com o suporte.
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: "#FEF2F2",
    padding: 20,
    borderRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#4B5563",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  stackText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

export default GlobalErrorBoundary;
