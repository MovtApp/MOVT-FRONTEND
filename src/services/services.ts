import { api } from "./api";
import loginJSON from "../__MOCK__/login_mock.json";
import type { AxiosResponse } from "axios";
import { supabase } from "./supabaseClient";

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

async function uploadImageToSupabase(imageUri: string): Promise<string | null> {
  if (!imageUri) {
    console.warn("Image URI is empty, skipping upload.");
    return null;
  }

  const fileName = imageUri.substring(imageUri.lastIndexOf('/') + 1);
  const fileExtension = fileName.split('.').pop();
  const newFileName = `${Date.now()}.${fileExtension}`;

  // Fetch the image file as a blob
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from('diet-images') // Substitua pelo nome do seu bucket
    .upload(newFileName, blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error("Erro ao fazer upload da imagem para o Supabase:", error);
    return null;
  }

  // Constrói a URL pública
  const { data: publicUrlData } = supabase.storage
    .from('diet-images')
    .getPublicUrl(newFileName);

  return publicUrlData.publicUrl;
}

export { auth_login, uploadImageToSupabase };
