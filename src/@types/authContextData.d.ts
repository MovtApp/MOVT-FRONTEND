declare type User = {
  id: number;
  name: string;
  token: string;
};

declare type AuthContextData = {
  user: User | null;
  signIn: (unit: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};
