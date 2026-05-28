// ruleid: token-in-asyncstorage
AsyncStorage.setItem("userSessionId", sessionId);

// ruleid: token-in-asyncstorage
AsyncStorage.setItem(STORAGE_KEY, access_token);

// ruleid: token-in-asyncstorage
AsyncStorage.setItem("@spotify_token", token);

// ruleid: token-in-asyncstorage
AsyncStorage.setItem("authData", refreshToken);

// ok: token-in-asyncstorage
AsyncStorage.setItem("theme", "dark");

// ok: token-in-asyncstorage
AsyncStorage.setItem("onboarding_done", "true");

// ok: token-in-asyncstorage
AsyncStorage.setItem("lastTab", currentTab);
