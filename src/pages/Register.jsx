import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";

const registerSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập ít nhất 3 ký tự").regex(/^[a-zA-Z0-9._-]+$/, "Chỉ chứa chữ, số, ., -, _"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  phone: z.string().optional().transform((v) => (v || "").trim()),
  dob: z.string().optional().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "YYYY-MM-DD"),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();

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
    const res = await auth.register({
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
      phone: values.phone || "",
      dob: values.dob || "",
    });
    if (!res.ok) {
      setError("username", { type: "manual", message: res.error });
      return;
    }
    reset();
    navigate("/login"); 
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-inherit text-inherit">
      <div className="w-[360px]">
        <Card className="rounded-2xl border border-border shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm">Sign Up</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Create an account to access all features.</CardDescription>
              </div>
              <button type="button" onClick={() => navigate("/login")} className="text-sm text-primary hover:underline ml-2">
                Login
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-muted-foreground mb-1">Username</label>
                <Input
                  id="username"
                  {...register("username")}
                  className={`rounded-full bg-background text-foreground border-border placeholder:text-muted-foreground ${
                    errors.username ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-ring"
                  }`}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
                {errors.username ? <p className="text-xs text-destructive mt-1">{errors.username.message}</p> : null}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={`rounded-full bg-background text-foreground border-border placeholder:text-muted-foreground ${
                    errors.email ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-ring"
                  }`}
                  placeholder="m@example.com"
                  autoComplete="email"
                />
                {errors.email ? <p className="text-xs text-destructive mt-1">{errors.email.message}</p> : null}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={`rounded-full bg-background text-foreground border-border placeholder:text-muted-foreground ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-ring"
                  }`}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                />
                {errors.password ? <p className="text-xs text-destructive mt-1">{errors.password.message}</p> : null}
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                <Input id="phone" {...register("phone")} className="rounded-full bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-ring" placeholder="0123456789" autoComplete="tel" />
              </div>

              <div>
                <label htmlFor="dob" className="block text-xs font-medium text-muted-foreground mb-1">Date of birth (YYYY-MM-DD)</label>
                <Input id="dob" type="date" {...register("dob")} className="rounded-full bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-ring" placeholder="YYYY-MM-DD" />
                {errors.dob ? <p className="text-xs text-destructive mt-1">{errors.dob.message}</p> : null}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 mt-2">
                {isSubmitting ? "Đang xử lý..." : "Register"}
              </Button>
            </form>
          </CardContent>

          <CardFooter />
        </Card>
      </div>
    </div>
  );
}