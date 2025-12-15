import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// API spec:
// POST /users/register
// { username, email, password, phone, dob }
// 201 -> User registered successfully
// 409 -> User already exists
// 401 -> Unauthorized (ví dụ khi thiếu/invalid token nếu API bảo vệ, nhưng spec ghi 401 Unauthorized)
// Lưu ý: AuthProvider tích hợp sau; hiện chỉ gọi API trực tiếp.

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    dob: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function onChange(e) {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          dob: form.dob, // YYYY-MM-DD
        }),
      });

      if (res.status === 201) {
        setSuccessMsg("User registered successfully");
        // Có thể tự động điều hướng sang login sau 1–2 giây
        setTimeout(() => navigate("/login"), 1200);
        return;
      }

      if (res.status === 409) {
        setErrorMsg("User already exists");
        return;
      }

      if (res.status === 401) {
        setErrorMsg("Unauthorized");
        return;
      }

      const text = await res.text().catch(() => "");
      setErrorMsg(text || `Register failed (HTTP ${res.status})`);
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
              <div className="text-sm font-semibold">Sign Up</div>
              <div className="text-xs text-slate-400">Create an account to access all features.</div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-sky-500 hover:underline ml-2"
            >
              Login
            </button>
          </div>

          <div className="p-5">
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-slate-600 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  value={form.username}
                  onChange={onChange}
                  className="w-full rounded-full border border-[#eef3fb] px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-full border border-[#eef3fb] px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="m@example.com"
                  autoComplete="email"
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
                  className="w-full rounded-full border border-[#eef3fb] px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-slate-600 mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full rounded-full border border-[#eef3fb] px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="0123456789"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label htmlFor="dob" className="block text-xs font-medium text-slate-600 mb-1">
                  Date of birth (YYYY-MM-DD)
                </label>
                <input
                  id="dob"
                  type="date"
                  value={form.dob}
                  onChange={onChange}
                  className="w-full rounded-full border border-[#eef3fb] px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="YYYY-MM-DD"
                />
              </div>

              {errorMsg ? <p className="text-xs text-red-600">{errorMsg}</p> : null}
              {successMsg ? <p className="text-xs text-green-600">{successMsg}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[#7FB0FF] hover:bg-[#6ea6f6] text-white font-medium py-2 shadow-sm transition disabled:opacity-70 mt-2"
              >
                {submitting ? "Đang xử lý..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}