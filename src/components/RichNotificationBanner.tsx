/**
 * RichNotificationBanner — o banner que aparece DENTRO do app quando chega um
 * push com o app aberto (o SO não desenha o dele nesse caso; ver o handler em
 * `usePushNotifications`).
 *
 * Antes era uma caixa escura com texto puro. Agora é um card estilo Instagram:
 * avatar de quem interagiu + nome + ação + miniatura do post.
 *
 * Por que uma SEGUNDA instância de <FlashMessage/> em vez de reusar a global:
 * o `MessageComponent` da lib só é configurável **por instância**, não por
 * mensagem — reusar a global obrigaria a herdar o `<Text>` de título do
 * `DefaultFlash` e ainda mudaria a aparência dos toasts de erro do `notify.ts`,
 * que compartilham aquela instância. Uma instância dedicada (com
 * `canRegisterAsDefault={false}`, para não roubar o `showMessage` global) dá
 * controle total do card sem tocar em nada existente.
 */
import React, { useRef } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FlashMessage from "react-native-flash-message";

export interface RichNotificationOptions {
  /** Título — normalmente o @username de quem interagiu. */
  title: string;
  /** Corpo — "curtiu sua publicação.", a prévia da mensagem, etc. */
  body?: string;
  /** Foto de quem interagiu (círculo à esquerda). */
  avatar?: string;
  /** Miniatura do conteúdo (quadrado à direita) — ex.: a imagem do post. */
  thumbnail?: string;
  /** Tipo da notificação (reservado para variações de layout). */
  type?: string;
  onPress?: () => void;
}

// Ref da instância dedicada. `showRichNotification` é chamado de fora do React
// (listener de push), por isso a ref vive no módulo.
let hostRef: FlashMessage | null = null;

/** Mostra o banner rico. No-op se o host ainda não montou. */
export function showRichNotification(opts: RichNotificationOptions): void {
  if (!hostRef) return;
  hostRef.showMessage({
    message: opts.title,
    description: opts.body,
    duration: 4500,
    // Campos próprios lidos pelo card abaixo (a lib repassa o objeto inteiro).
    ...({ avatar: opts.avatar, thumbnail: opts.thumbnail, kind: opts.type } as any),
    onPress: opts.onPress,
  });
}

/** Iniciais como fallback quando não há avatar (evita quadrado vazio). */
function initials(name: string): string {
  const clean = (name || "").replace(/^@/, "").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || clean[0].toUpperCase();
}

/** O card. Puramente visual: o toque é tratado pelo wrapper da lib. */
const RichCard = ({ message }: any) => {
  const insets = useSafeAreaInsets();
  const avatar: string | undefined = message?.avatar;
  const thumbnail: string | undefined = message?.thumbnail;
  const title: string = message?.message || "";
  const body: string | undefined = message?.description;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <View style={styles.card}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>{initials(title)}</Text>
          </View>
        )}

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!body && (
            <Text style={styles.body} numberOfLines={2}>
              {body}
            </Text>
          )}
        </View>

        {!!thumbnail && <Image source={{ uri: thumbnail }} style={styles.thumb} />}
      </View>
    </View>
  );
};

/**
 * Monte UMA vez, perto da raiz (App.tsx), DEPOIS do <FlashMessage/> global —
 * quem monta por último fica por cima, e o banner de notificação deve cobrir o
 * toast, não o contrário.
 */
export const RichNotificationHost: React.FC = () => {
  const ref = useRef<FlashMessage | null>(null);
  return (
    <FlashMessage
      ref={(r) => {
        ref.current = r;
        hostRef = r;
      }}
      position="top"
      floating
      canRegisterAsDefault={false}
      MessageComponent={RichCard}
      // O card já desenha o próprio fundo/insets; o wrapper fica transparente.
      style={styles.host}
    />
  );
};

const styles = StyleSheet.create({
  host: { backgroundColor: "transparent", paddingHorizontal: 0, paddingVertical: 0 },
  wrapper: { paddingHorizontal: 12, paddingBottom: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#192126",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    // Elevação: o banner precisa parecer que flutua sobre o conteúdo.
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2A3439" },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { color: "#BBF246", fontSize: 16, fontWeight: "700" },
  textCol: { flex: 1 },
  title: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  body: { color: "#C7D0D4", fontSize: 13, marginTop: 2 },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#2A3439" },
});
