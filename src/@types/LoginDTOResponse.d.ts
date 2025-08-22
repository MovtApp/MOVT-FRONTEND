declare interface LoginResponse {
  message: string;
  usuario: Usuario;
}

declare interface Usuario {
  id: number;
  nome: string;
  login: string;
  nome_unidade: string;
  unidade: string;
}
