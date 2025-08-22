import { api } from "./api";
import loginJSON from "@/__MOCK__/login_mock.json";
import type { AxiosResponse } from "axios";

const DEV = false;
const timeout = 900;

const ROUTE_PATH_AUTH = "/login";

const auth_login = async (unidade: string, login: string, senha: string) => {
  if (DEV) {
    console.log("Mocking API response");
    const response = {
      data: loginJSON,
      status: 200,
      statusText: "OK",
    };
    await new Promise((resolve) => setTimeout(resolve, timeout));

    return response as unknown as AxiosResponse<LoginResponse>;
  }

  return await api.post<LoginResponse>(ROUTE_PATH_AUTH, {
    unidade: unidade.toUpperCase(),
    login,
    senha,
  });
};

export { auth_login };
