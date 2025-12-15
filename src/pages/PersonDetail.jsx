import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPersonById, getImageUrl } from "@/lib/moviesApi";

// Dùng đúng helper trong moviesApi → gọi /api/persons/:id
// Route trên app vẫn là /person/:id (React Router), chỉ thay đổi đường fetch data.

function fmtDate(iso) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        // Quan trọng: dùng fetchPersonById (-> /api/persons/:id)
        const data = await fetchPersonById(id, { signal: controller.signal });
        console.log("[PersonDetail] data", data);
        setPerson(data || null);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load person");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
        <div className="py-12 text-center text-muted-foreground">Loading person...</div>
      </main>
    );
  }

  if (error || !person) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
        <div className="py-12 text-center text-destructive">{error || "Person not found"}</div>
      </main>
    );
  }

  // Luôn hiển thị các dòng thông tin, dùng N/A nếu thiếu (để "không bị trống" như bạn nói)
  const name = person.name || "Unknown";
  const image = person.image ? getImageUrl(person.image) : "";
  const role = person.role || "N/A";
  const summary = person.summary || "N/A";
  const birth = person.birth_date ? fmtDate(person.birth_date) : "N/A";
  const death = person.death_date ? fmtDate(person.death_date) : "—";
  const height = person.height || "N/A";
  const awards = person.awards || "N/A";
  const knownFor = Array.isArray(person.known_for) ? person.known_for : [];

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-12">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{name}</span>
      </div>

      <div className="flex items-start gap-6">
        {/* Ảnh trái */}
        <div className="shrink-0 w-[220px] sm:w-[260px] md:w-[300px]">
          <div className="overflow-hidden rounded-md border bg-card">
            {image ? (
              <img src={image} alt={name} className="w-full object-cover aspect-[2/3]" />
            ) : (
              <div className="w-full bg-muted aspect-[2/3]" />
            )}
          </div>
        </div>

        {/* Thông tin phải (đơn giản, luôn có N/A) */}
        <div className="min-w-0 flex-1 space-y-5">
          <h1 className="text-2xl font-semibold">{name}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="font-semibold">Role: </span>{role}</div>
            <div><span className="font-semibold">Height: </span>{height}</div>
            <div><span className="font-semibold">Born: </span>{birth}</div>
            <div><span className="font-semibold">Died: </span>{death}</div>
            <div className="sm:col-span-2"><span className="font-semibold">Awards: </span>{awards}</div>
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-line">
            <span className="font-semibold">Summary: </span>
            {summary}
          </div>

          {/* Known for */}
          {knownFor.length > 0 && (
            <section className="pt-2">
              <h2 className="text-lg font-semibold mb-3">Known for</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {knownFor.map((m) => (
                  <Link
                    key={m.id}
                    to={`/movies/${m.id}`}
                    className="block overflow-hidden rounded-md border bg-card hover:scale-105 transition-transform"
                  >
                    {m.image ? (
                      <img
                        src={getImageUrl(m.image)}
                        alt={m.title}
                        className="aspect-[2/3] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[2/3] w-full bg-muted" />
                    )}
                    <div className="px-3 py-2">
                      <div className="text-sm font-medium">
                        {m.title} {m.year ? `(${m.year})` : ""}
                      </div>
                      {m.character ? (
                        <div className="text-xs text-muted-foreground mt-0.5">as {m.character}</div>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}