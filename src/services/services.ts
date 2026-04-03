import { api } from "./api";
import loginJSON from "../__MOCK__/login_mock.json";
import type { AxiosResponse } from "axios";
import { supabase } from "./supabaseClient"; // Importação correta do cliente Supabase
import * as FileSystem from "expo-file-system/legacy";
import "react-native-url-polyfill/auto"; // Importa polyfills para URL, URLSearchParams, Blob, File, etc.

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

async function uploadImageToSupabase(imageUri: string, bucketName: string = "diet-images"): Promise<string | null> {
  if (!imageUri) {
    console.warn("Image URI is empty, skipping upload.");
    return null;
  }

  const fileName = imageUri.substring(imageUri.lastIndexOf("/") + 1);
  const fileExtension = fileName.split(".").pop();
  const newFileName = `${Date.now()}.${fileExtension}`;

  let contentType = "image/jpeg"; 
  switch (fileExtension?.toLowerCase()) {
    case "png":
      contentType = "image/png";
      break;
    case "jpg":
    case "jpeg":
      contentType = "image/jpeg";
      break;
    case "gif":
      contentType = "image/gif";
      break;
  }

  console.log("Detected file extension:", fileExtension);
  console.log("Inferred content type:", contentType);
  console.log("Target bucket:", bucketName);

  try {
    // 1. Obter uma URL de upload assinada do Supabase
    const { data: signedUploadData, error: signedUploadError } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(newFileName);

    if (signedUploadError) {
      console.error("❌ Erro ao obter URL de upload assinada do Supabase:", signedUploadError);
      throw signedUploadError;
    }

    const { signedUrl, path } = signedUploadData;

    // 2. Converter imagem para Blob de forma eficiente no React Native
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // 3. Fazer o upload para a URL assinada
    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ Erro no upload direto (${uploadResponse.status}):`, errorText);
      throw new Error(`Falha no upload direto da imagem: ${uploadResponse.status}`);
    }

    console.log("✅ Upload concluído com sucesso.");

    // 4. Obter a URL pública
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);

    if (!publicUrlData.publicUrl) {
      throw new Error("Falha ao obter a URL pública da imagem");
    }

    console.log("✅ Imagem enviada com sucesso, URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error("❌ Erro no processamento ou upload da imagem:", err.message);
    return null;
  }
}

export { auth_login, uploadImageToSupabase };
