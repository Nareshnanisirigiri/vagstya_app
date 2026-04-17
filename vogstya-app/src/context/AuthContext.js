import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);
const SESSION_WARNING_MS = 15000;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || "").trim());
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [sessionExpiresAt, setSessionExpiresAt] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const warningTimerRef = useRef(null);
  const expiryTimerRef = useRef(null);

  useEffect(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);

    if (!token || !sessionExpiresAt) return undefined;

    const expiresAt = new Date(sessionExpiresAt).getTime();
    if (!Number.isFinite(expiresAt)) return undefined;

    const msRemaining = expiresAt - Date.now();
    if (msRemaining <= 0) {
      setSessionNotice("Your session expired. Please sign in again.");
      setUser(null);
      setToken("");
      setSessionExpiresAt("");
      return undefined;
    }

    if (msRemaining > SESSION_WARNING_MS) {
      warningTimerRef.current = setTimeout(() => {
        setSessionNotice("Your session is about to expire. Please sign in again soon.");
      }, msRemaining - SESSION_WARNING_MS);
    }

    expiryTimerRef.current = setTimeout(() => {
      setSessionNotice("Your session expired. Please sign in again.");
      setUser(null);
      setToken("");
      setSessionExpiresAt("");
    }, msRemaining);

    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, [token, sessionExpiresAt]);

  const value = useMemo(() => {
    function applyAuth(payload) {
      setUser(payload.user || null);
      setToken(payload.token || "");
      setSessionExpiresAt(payload.expiresAt || "");
      setSessionNotice("");
    }

    async function register({ name, email, password, phone, role = "customer", adminPasscode = "" }) {
      const e = String(email || "").trim().toLowerCase();
      if (!name || String(name).trim().length < 2) {
        return { ok: false, error: "Please enter your name." };
      }
      if (!isValidEmail(e)) return { ok: false, error: "Please enter a valid email." };
      if (String(password || "").length < 8) {
        return { ok: false, error: "Password must be at least 8 characters." };
      }
      if (role === "admin" && String(adminPasscode || "").trim().length < 4) {
        return { ok: false, error: "Enter the admin registration passcode." };
      }
      try {
        const path = role === "admin" ? "/auth/admin/register" : "/auth/register";
        const payload = await apiRequest(path, {
          method: "POST",
          body:
            role === "admin"
              ? {
                  name: String(name).trim(),
                  email: e,
                  password,
                  phone: phone || null,
                  passcode: adminPasscode,
                }
              : { name: String(name).trim(), email: e, password, phone: phone || null },
        });
        applyAuth(payload);
        return { ok: true, user: payload.user || null };
      } catch (err) {
        return { ok: false, error: err.message || "Registration failed." };
      }
    }

    async function login({ email, password, role = "customer" }) {
      const e = String(email || "").trim().toLowerCase();
      if (!isValidEmail(e)) return { ok: false, error: "Please enter a valid email." };
      if (!password) return { ok: false, error: "Please enter your password." };
      try {
        const payload = await apiRequest(role === "admin" ? "/auth/admin/login" : "/auth/login", {
          method: "POST",
          body: role === "admin" ? { email: e, password, role: "admin" } : { email: e, password },
        });
        applyAuth(payload);
        return { ok: true, user: payload.user || null };
      } catch (err) {
        return { ok: false, error: err.message || "Invalid email or password." };
      }
    }

    function logout() {
      setUser(null);
      setToken("");
      setSessionExpiresAt("");
      setSessionNotice("");
    }

    function clearSessionNotice() {
      setSessionNotice("");
    }

    function requestPasswordReset(email) {
      const e = String(email || "").trim().toLowerCase();
      if (!isValidEmail(e)) return { ok: false, error: "Please enter a valid email." };
      // in a real app: call API. Here: always succeed to avoid account enumeration.
      return { ok: true, message: "Password reset service will be connected from backend." };
    }

    return {
      user,
      token,
      sessionExpiresAt,
      sessionNotice,
      register,
      login,
      logout,
      clearSessionNotice,
      requestPasswordReset,
    };
  }, [user, token, sessionExpiresAt, sessionNotice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
