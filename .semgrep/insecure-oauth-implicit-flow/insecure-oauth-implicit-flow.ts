import { useAuthRequest, ResponseType } from "expo-auth-session";

// ruleid: insecure-oauth-implicit-flow
const [reqA] = useAuthRequest({ clientId: "x", usePKCE: false, scopes: [] }, discovery);

// ruleid: insecure-oauth-implicit-flow
const [reqB] = useAuthRequest({ responseType: ResponseType.Token, clientId: "x" }, discovery);

// ruleid: insecure-oauth-implicit-flow
const reqC = { responseType: AuthSession.ResponseType.Token };

// ok: insecure-oauth-implicit-flow
const [reqD] = useAuthRequest({ clientId: "x", usePKCE: true, scopes: [] }, discovery);

// ok: insecure-oauth-implicit-flow
const [reqE] = useAuthRequest({ responseType: ResponseType.Code, clientId: "x" }, discovery);
