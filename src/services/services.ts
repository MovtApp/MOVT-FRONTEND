import { api } from "./api";
import loginJSON from "../__MOCK__/login_mock.json";
import type { AxiosResponse } from "axios";
import { supabase } from "./supabaseClient"; // Importação correta do cliente Supabase
import * as FileSystem from 'expo-file-system/legacy';
import 'react-native-url-polyfill/auto'; // Importa polyfills para URL, URLSearchParams, Blob, File, etc.

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

  let contentType = 'image/jpeg'; // Default content type, will try to infer more accurately
  switch (fileExtension) {
    case 'png':
      contentType = 'image/png';
      break;
    case 'jpg':
    case 'jpeg':
      contentType = 'image/jpeg';
      break;
    case 'gif':
      contentType = 'image/gif';
      break;
    // Add more types as needed
  }

  console.log('Detected file extension:', fileExtension);
  console.log('Inferred content type:', contentType);

  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      console.error("❌ Arquivo de imagem não encontrado:", imageUri);
      throw new Error('Arquivo de imagem não encontrado.'); // Lançar erro para ser capturado no DietFormSheet
    }

    // Read the image file as a Base64 string
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Convert Base64 to ArrayBuffer
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    // 1. Obter uma URL de upload assinada do Supabase
    const { data: signedUploadData, error: signedUploadError } = await supabase.storage
      .from('diet-images') // Certifique-se de que este é o nome correto do seu bucket
      .createSignedUploadUrl(newFileName);

    if (signedUploadError) {
      console.error("❌ Erro ao obter URL de upload assinada do Supabase:", signedUploadError);
      console.error("Detalhes do erro do createSignedUploadUrl:", JSON.stringify(signedUploadError, null, 2));
      throw signedUploadError; // Rejeitar a Promise
    }

    const { signedUrl, path } = signedUploadData; // 'path' vem de signedUploadData, não é mais data.path

    // 2. Usar fetch para fazer o upload diretamente para a URL assinada
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Cache-Control': '3600',
        'x-upsert': 'true', // Garante que o arquivo seja sobrescrito se já existir
      },
      body: arrayBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ Erro HTTP no upload direto (${uploadResponse.status}):`, errorText);
      throw new Error(`Falha no upload direto da imagem: ${uploadResponse.status} - ${errorText}`);
    }

    console.log('✅ Upload direto concluído com sucesso para a URL assinada.');

    // 3. Obter a URL pública (usamos o 'path' que obtivemos da URL assinada)
    const { data: publicUrlData } = supabase.storage
      .from('diet-images')
      .getPublicUrl(path); // Usar o 'path' do signedUploadData

    if (!publicUrlData.publicUrl) {
      console.error('❌ Não foi possível obter a URL pública da imagem após upload direto');
      throw new Error('Falha ao obter a URL pública da imagem');
    }

    console.log('✅ Imagem enviada com sucesso, URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error('❌ Erro no processamento ou upload da imagem:', err.message);
    // O erro já foi lançado e tratado em DietFormSheet, aqui só registramos
    return null;
  }
}

export { auth_login, uploadImageToSupabase };
