import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

interface UserProfile {
  id: string;
  username: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem("chat_token");
    if (savedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
    return savedToken;
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem("chat_user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = (newToken: string, userProfile: UserProfile) => {
    localStorage.setItem("chat_token", newToken);
    localStorage.setItem("chat_user", JSON.stringify(userProfile));
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userProfile);
  };

  const logout = () => {
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be executed within an enclosed AuthProvider wrapper.");
  }
  return context;
};