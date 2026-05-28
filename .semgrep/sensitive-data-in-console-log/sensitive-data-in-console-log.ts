// ruleid: sensitive-data-in-console-log
console.log("Expo Push Token:", tokenData.data);

// ruleid: sensitive-data-in-console-log
console.error("Erro", { password: pwd });

// ruleid: sensitive-data-in-console-log
console.log("access_token recebido:", access_token);

// ruleid: sensitive-data-in-console-log
console.warn("Falha ao salvar o refreshToken", refreshToken);

// ruleid: sensitive-data-in-console-log
console.log("Session ID:", user?.sessionId);

// ruleid: sensitive-data-in-console-log
console.log("Headers padrão:", api.defaults.headers); // contém Authorization

// ok: sensitive-data-in-console-log
console.log("Resposta recebida:", response.status);

// ok: sensitive-data-in-console-log
console.log("Usuário logado com sucesso");

// ok: sensitive-data-in-console-log
console.error("Erro na requisição:", error.config?.url);
