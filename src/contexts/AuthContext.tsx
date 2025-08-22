import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth_login } from "@/services/services";

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // State to track loading

  useEffect(() => {
    async function loadUserData() {
      try {
        const storedUser = await AsyncStorage.getItem("@Auth:user");
        const storedToken = await AsyncStorage.getItem("@Auth:token");

        if (storedUser && storedToken) {
          setUser({
            ...JSON.parse(storedUser),
            token: JSON.parse(storedToken),
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false); // Stop loading once data is loaded
      }
    }

    loadUserData();
  }, []);

  async function signIn(unit: string, username: string, password: string) {
    try {
      // Mocked API response
      const response = await auth_login(unit, username, password);

      // Save token to AsyncStorage
      await AsyncStorage.setItem(
        "@Auth:token",
        JSON.stringify(response.data.usuario.login),
      );
      await AsyncStorage.setItem(
        "@Auth:user",
        JSON.stringify(response.data.usuario),
      );
      setUser({
        id: response.data.usuario.id,
        name: response.data.usuario.nome,
        token: response.data.usuario.login,
      });
    } catch (error) {
      console.log("Error during signIn:", error);
      throw new Error("Failed to sign in");
    }
  }

  async function signOut() {
    setUser(null);
    await AsyncStorage.removeItem("@Auth:token");
    await AsyncStorage.removeItem("@Auth:user");
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
