import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "@/lib/http";
import Spinner from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const profileSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[\d+()\-\s]{6,20}$/.test(v), "Số điện thoại không hợp lệ"),
  dob: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Ngày sinh phải theo định dạng YYYY-MM-DD"),
});

// Lấy các field thay đổi
function diffChanges(values, profile) {
  const changes = {};
  const orig = {
    email: (profile?.email ?? "").trim(),
    phone: (profile?.phone ?? "").trim(),
    dob: (profile?.dob ?? "").trim(),
  };
  const next = {
    email: (values.email ?? "").trim(),
    phone: (values.phone ?? "").trim(),
    dob: (values.dob ?? "").trim(),
  };

  if (next.email && next.email !== orig.email) changes.email = next.email;
  if (next.phone !== orig.phone) changes.phone = next.phone;
  if (next.dob !== orig.dob) changes.dob = next.dob;

  return changes;
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { email: "", phone: "", dob: "" },
  });

  // Fetch profile khi mount
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await apiFetch("/users/profile", { method: "GET", signal: controller.signal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        const p = data?.data || data || null;
        setProfile(p);

        // Reset form theo dữ liệu hiện có
        reset({
          email: p?.email ?? "",
          phone: p?.phone ?? "",
          dob: p?.dob ?? "",
        });
      } catch (e) {
        if (e?.name !== "AbortError") setErr(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [reset]);

  const hasData = useMemo(() => !!profile, [profile]);

  async function onSave(values) {
    const changes = diffChanges(values, profile);
    if (!Object.keys(changes).length) return;

    const res = await apiFetch("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(changes),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Update failed (HTTP ${res.status})`);
    }

    let updated = null;
    try {
      const json = await res.json();
      updated = json?.data || json || null;
    } catch {
      updated = { ...(profile || {}), ...changes };
    }

    setProfile(updated);
    reset({
      email: updated?.email ?? "",
      phone: updated?.phone ?? "",
      dob: updated?.dob ?? "",
    });
  }

  return (
    <main className="max-w-[1000px] mx-auto mt-6 px-4 pb-10">
      <h1 className="text-xl font-semibold mb-4">Profile</h1>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner size={28} /></div>
      ) : err ? (
        <div className="py-12 text-center text-destructive">{err}</div>
      ) : !hasData ? (
        <div className="py-12 text-center text-muted-foreground">No profile data.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bảng thông tin */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
              <CardDescription>Chi tiết hiện tại của hồ sơ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">Username: </span>
                {profile.username ?? "—"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Email: </span>
                {profile.email ?? "—"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Phone: </span>
                {profile.phone ?? "—"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Date of birth: </span>
                {profile.dob ?? "—"}
              </div>
              {"role" in profile && (
                <div className="text-sm">
                  <span className="font-medium">Role: </span>
                  {profile.role}
                </div>
              )}
              {"id" in profile && (
                <div className="text-sm">
                  <span className="font-medium">ID: </span>
                  {String(profile.id)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form chỉnh sửa */}
          <Card>
            <CardHeader>
              <CardTitle>Chỉnh sửa hồ sơ</CardTitle>
              <CardDescription>Cho phép sửa Email, Phone, DOB</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(async (vals) => {
                  try {
                    await onSave(vals);
                  } catch (e) {
                    alert(e?.message || "Update failed");
                  }
                })}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
                    {...register("email")}
                    className={`rounded-md bg-background text-foreground border-border placeholder:text-muted-foreground ${
                      errors.email ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-ring"
                    }`}
                  />
                  {errors.email ? (
                    <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-muted-foreground mb-1">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    placeholder="0123456789"
                    autoComplete="tel"
                    {...register("phone")}
                    className="rounded-md bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                  {errors.phone ? (
                    <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="dob" className="block text-xs font-medium text-muted-foreground mb-1">
                    Date of birth (YYYY-MM-DD)
                  </label>
                  <Input
                    id="dob"
                    type="date"
                    placeholder="YYYY-MM-DD"
                    {...register("dob")}
                    className="rounded-md bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                  {errors.dob ? (
                    <p className="text-xs text-destructive mt-1">{errors.dob.message}</p>
                  ) : null}
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                  >
                    {isSubmitting ? "Đang lưu..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}