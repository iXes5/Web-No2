import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import Spinner from "@/components/ui/spinner";
import { Link } from "react-router-dom";
import { getImageUrl } from "@/lib/moviesApi";

function MovieCard({ movie }) {
  const title = movie?.title || movie?.name || "Untitled";
  const year = movie?.year || movie?.release_year || "";
  const img = movie?.image ? getImageUrl(movie.image) : "";

  return (
    <Link to={movie?.id ? `/movies/${movie.id}` : "#"} className="block overflow-hidden rounded-md border bg-card hover:scale-105 transition-transform">
      {img ? (
        <img src={img} alt={title} className="aspect-[2/3] w-full object-cover" loading="lazy" />
      ) : (
        <div className="aspect-[2/3] w-full bg-muted" />
      )}
      <div className="px-3 py-2 text-center">
        <div className="text-sm font-medium">
          {title} {year ? `(${year})` : ""}
        </div>
      </div>
    </Link>
  );
}

export default function Favorites() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await apiFetch("/users/favorites", { method: "GET", signal: controller.signal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setItems(list);
      } catch (e) {
        if (e?.name !== "AbortError") setErr(e?.message || "Failed to load favorites");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
      <h1 className="text-lg font-semibold mb-3">Your favorites</h1>
      {loading ? (
        <div className="py-12 flex justify-center"><Spinner size={28} /></div>
      ) : err ? (
        <div className="py-12 text-center text-destructive">{err}</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No favorites yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((m) => <MovieCard key={m.id || m.title} movie={m} />)}
        </div>
      )}
    </main>
  );
}