import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Khởi tạo từ localStorage
  useEffect(() => {
    const t = localStorage.getItem("app_token");
    const u = localStorage.getItem("app_user");
    if (t) setToken(t);
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        // ignore
      }
    }
  }, []);

  const isAuthenticated = !!token && !!user;

  // API: POST /users/register { username, email, password, phone, dob }
  async function register(payload) {
    // Giả định payload đã được validate bằng zod/react-hook-form ở UI
    try {
      const res = await fetch("/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        return { ok: true };
      }
      if (res.status === 409) {
        return { ok: false, error: "User already exists" };
      }
      if (res.status === 401) {
        return { ok: false, error: "Unauthorized" };
      }
      const text = await res.text().catch(() => "");
      return { ok: false, error: text || `Register failed (HTTP ${res.status})` };
    } catch (e) {
      return { ok: false, error: e?.message || "Network error" };
    }
  }

  // API: POST /users/login { username, password }
  async function login({ username, password }) {
    try {
      const res = await fetch("/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        if (json?.token) {
          localStorage.setItem("app_token", json.token);
          setToken(json.token);
        }
        if (json?.user) {
          localStorage.setItem("app_user", JSON.stringify(json.user));
          setUser(json.user);
        }
        return { ok: true };
      }
      if (res.status === 401) {
        return { ok: false, error: "Invalid credentials" };
      }
      const text = await res.text().catch(() => "");
      return { ok: false, error: text || `Login failed (HTTP ${res.status})` };
    } catch (e) {
      return { ok: false, error: e?.message || "Network error" };
    }
  }

  function logout() {
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, isAuthenticated, register, login, logout }),
    [token, user, isAuthenticated]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}