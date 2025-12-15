import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import Spinner from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

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
        setProfile(data?.data || data || null);
      } catch (e) {
        if (e?.name !== "AbortError") setErr(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <main className="max-w-[800px] mx-auto mt-6 px-4 pb-10">
      {loading ? (
        <div className="py-12 flex justify-center"><Spinner size={28} /></div>
      ) : err ? (
        <div className="py-12 text-center text-destructive">{err}</div>
      ) : !profile ? (
        <div className="py-12 text-center text-muted-foreground">No profile data.</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Thông tin tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {"id" in profile && <div className="text-sm"><span className="font-medium">ID: </span>{String(profile.id)}</div>}
            {"username" in profile && <div className="text-sm"><span className="font-medium">Username: </span>{profile.username}</div>}
            {"email" in profile && <div className="text-sm"><span className="font-medium">Email: </span>{profile.email}</div>}
            {"phone" in profile && <div className="text-sm"><span className="font-medium">Phone: </span>{profile.phone}</div>}
            {"dob" in profile && <div className="text-sm"><span className="font-medium">DOB: </span>{profile.dob}</div>}
            {"role" in profile && <div className="text-sm"><span className="font-medium">Role: </span>{profile.role}</div>}
          </CardContent>
        </Card>
      )}
    </main>
  );
}