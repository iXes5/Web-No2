import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";

const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập username"),
  password: z.string().min(1, "Vui lòng nhập password"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values) {
    const res = await auth.login({
      username: values.username.trim(),
      password: values.password,
    });
    if (!res.ok) {
      setError("username", { type: "manual", message: res.error });
      return;
    }
    reset();
    navigate("/"); // NavBar sẽ tự chuyển sang Profile box do context state thay đổi
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-inherit text-inherit">
      <div className="w-[360px]">
        <Card className="rounded-2xl border border-border shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm">Login</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Sign in to continue</CardDescription>
              </div>
              <button type="button" onClick={() => navigate("/register")} className="text-sm text-primary hover:underline ml-2">
                Sign Up
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={`rounded-full bg-background text-foreground border-border placeholder:text-muted-foreground ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-ring"
                  }`}
                  placeholder="••••••"
                  autoComplete="current-password"
                />
                {errors.password ? <p className="text-xs text-destructive mt-1">{errors.password.message}</p> : null}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 mt-2">
                {isSubmitting ? "Đang xử lý..." : "LogIn"}
              </Button>
            </form>
          </CardContent>

          <CardFooter />
        </Card>
      </div>
    </div>
  );
}