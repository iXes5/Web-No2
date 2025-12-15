import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// API: POST /users/register
// { username, email, password, phone, dob }
// 201 -> User registered successfully
// 409 -> User already exists
// 401 -> Unauthorized

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Tên đăng nhập ít nhất 3 ký tự")
    .regex(/^[a-zA-Z0-9._-]+$/, "Tên đăng nhập chỉ chứa chữ, số, ., -, _"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  phone: z
    .string()
    .optional()
    .transform((v) => (v || "").trim()),
  dob: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "Ngày sinh phải theo định dạng YYYY-MM-DD"
    ),
});

export default function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", phone: "", dob: "" },
  });

  async function onSubmit(values) {
    try {
      const payload = {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: values.phone || "",
        dob: values.dob || "",
      };

      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        // Thông báo nhẹ, sau đó chuyển sang Login
        alert("User registered successfully");
        reset();
        navigate("/login");
        return;
      }

      if (res.status === 409) {
        setError("username", { type: "manual", message: "User already exists" });
        return;
      }

      if (res.status === 401) {
        setError("username", { type: "manual", message: "Unauthorized" });
        return;
      }

      const text = await res.text().catch(() => "");
      setError("username", { type: "manual", message: text || `Register failed (HTTP ${res.status})` });
    } catch (e) {
      setError("username", { type: "manual", message: e?.message || "Network error" });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f9ff] px-4">
      <div className="w-[360px]">
        <Card className="rounded-2xl border border-[#e6eefc] shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm">Sign Up</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Create an account to access all features.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-sky-500 hover:underline ml-2"
              >
                Login
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-slate-600 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  {...register("username")}
                  className={`w-full rounded-full border px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
                    errors.username ? "border-red-300 focus:ring-red-200" : "border-[#eef3fb] focus:ring-sky-200"
                  }`}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
                {errors.username ? (
                  <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={`w-full rounded-full border px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
                    errors.email ? "border-red-300 focus:ring-red-200" : "border-[#eef3fb] focus:ring-sky-200"
                  }`}
                  placeholder="m@example.com"
                  autoComplete="email"
                />
                {errors.email ? (
                  <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={`w-full rounded-full border px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
                    errors.password ? "border-red-300 focus:ring-red-200" : "border-[#eef3fb] focus:ring-sky-200"
                  }`}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                />
                {errors.password ? (
                  <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-slate-600 mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  {...register("phone")}
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
                  {...register("dob")}
                  className="w-full rounded-full border border-[#eef3fb] px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="YYYY-MM-DD"
                />
                {errors.dob ? <p className="text-xs text-red-600 mt-1">{errors.dob.message}</p> : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-[#7FB0FF] hover:bg-[#6ea6f6] text-white font-medium py-2 shadow-sm transition disabled:opacity-70 mt-2"
              >
                {isSubmitting ? "Đang xử lý..." : "Register"}
              </button>
            </form>
          </CardContent>

          <CardFooter />
        </Card>
      </div>
    </div>
  );
}