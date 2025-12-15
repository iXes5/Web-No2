import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Lưu ý: AuthProvider sẽ tích hợp sau. Hiện tại chỉ gọi API trực tiếp.
// API spec:
// POST /users/login { username, password }
// 200 -> { message, token, user: { id, username, email } }
// 401 -> Invalid credentials

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function onChange(e) {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        // Tạm thời lưu token vào localStorage, AuthProvider sẽ refactor sau
        if (json?.token) localStorage.setItem("app_token", json.token);
        // Có thể lưu user tạm thời
        if (json?.user) localStorage.setItem("app_user", JSON.stringify(json.user));
        navigate("/");
        return;
      }

      if (res.status === 401) {
        setErrorMsg("Invalid credentials");
        return;
      }

      const text = await res.text().catch(() => "");
      setErrorMsg(text || `Login failed (HTTP ${res.status})`);
    } catch (err) {
      setErrorMsg(err?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f9ff] px-4">
      <div className="w-[340px]">
        <div className="rounded-2xl border border-[#e6eefc] shadow-sm bg-white">
          <div className="p-5 flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">Login</div>
              <div className="text-xs text-slate-400">Sign in to continue</div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm text-sky-500 hover:underline ml-2"
            >
              Sign Up
            </button>
          </div>

          <div className="p-5">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-slate-600 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  value={form.username}
                  onChange={onChange}
                  className="w-full rounded-full border px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 border-[#eef3fb] focus:ring-sky-200"
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  className="w-full rounded-full border px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 border-[#eef3fb] focus:ring-sky-200"
                  placeholder="••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              {errorMsg ? <p className="text-xs text-red-600">{errorMsg}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[#7FB0FF] hover:bg-[#6ea6f6] text-white font-medium py-2 shadow-sm transition disabled:opacity-70 mt-2"
                aria-label="Log in"
              >
                {submitting ? "Đang xử lý..." : "LogIn"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}