import { Platform } from "react-native";
import MapView, {
  Marker,
  Polyline,
  LatLng,
  Region,
  MapStyleElement,
  PROVIDER_GOOGLE,
} from "react-native-maps";

/**
 * Provider do mapa por plataforma. Android usa Google (chave em `app.json` →
 * `android.config.googleMaps`). iOS usa o provider nativo padrão = **Apple Maps**
 * (`undefined`), que não exige chave e desenha rota/marcadores igual — evita ter
 * que provisionar e pagar uma chave do Google Maps SDK iOS. Use SEMPRE isto em
 * `provider={...}` no lugar de `PROVIDER_GOOGLE` fixo (que deixaria o mapa em
 * branco no iOS por falta de chave). Estilo customizado (`customMapStyle`) é
 * ignorado pelo Apple Maps — degradação apenas cosmética.
 */
export const MAP_PROVIDER = Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;

export { Marker, Polyline, PROVIDER_GOOGLE };
export type { LatLng, Region, MapStyleElement };
export default MapView;
