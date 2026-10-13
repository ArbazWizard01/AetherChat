import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  useEffect(() => {
    const fetchFreshUserData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://localhost:8080/api/auth/me");
        const freshUser = response.data?.user || response.data;

        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem("chat_user", JSON.stringify(freshUser));
        }
      } catch (error) {
        console.error("Failed to re-authenticate or fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFreshUserData();
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
    localStorage.removeItem("activeConversationId");
    localStorage.removeItem("last_selected_chat");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newProfile = { ...prev, ...updatedData };
      localStorage.setItem("chat_user", JSON.stringify(newProfile));
      return newProfile;
    });
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be executed within an enclosed AuthProvider wrapper.",
    );
  }
  return context;
};
