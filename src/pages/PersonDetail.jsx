import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPersonById, getImageUrl } from "@/lib/moviesApi";

// Helpers
function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return String(iso);
  }
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
        const data = await fetchPersonById(id, { signal: controller.signal });
        console.log("[PersonDetail] data", data);
        setPerson(data || null);
      } catch (e) {
        // BỎ QUA lỗi hủy (AbortError) do StrictMode/cleanup gây ra
        const msg = String(e?.message || "");
        if (e?.name === "AbortError" || msg.toLowerCase().includes("aborted")) {
          return;
        }
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

  const name = person.name || "Unknown";
  const role = person.role || "";
  const image = person.image ? getImageUrl(person.image) : "";
  const summary = person.summary || "";
  const birth = person.birth_date ? formatDate(person.birth_date) : "";
  const death = person.death_date ? formatDate(person.death_date) : "";
  const height = person.height || "";
  const awards = person.awards || "";
  const knownFor = toArray(person.known_for);

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-12">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{name}</span>
      </div>

      {/* Bố cục: Ảnh trái, thông tin phải */}
      <div className="flex items-start gap-6">
        {/* Trái: Ảnh người */}
        <div className="shrink-0 w-[220px] sm:w-[260px] md:w-[300px]">
          <div className="overflow-hidden rounded-md border bg-card">
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-full object-cover aspect-[2/3]"
              />
            ) : (
              <div className="w-full bg-muted aspect-[2/3]" />
            )}
          </div>
        </div>

        {/* Phải: Thông tin */}
        <div className="min-w-0 flex-1 space-y-5">
          <h1 className="text-2xl font-semibold">{name}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {role && (
              <div>
                <span className="font-semibold">Role: </span>
                <span>{role}</span>
              </div>
            )}
            {height && (
              <div>
                <span className="font-semibold">Height: </span>
                <span>{height}</span>
              </div>
            )}
            {birth && (
              <div>
                <span className="font-semibold">Born: </span>
                <span>{birth}</span>
              </div>
            )}
            {death && (
              <div>
                <span className="font-semibold">Died: </span>
                <span>{death}</span>
              </div>
            )}
            {awards && (
              <div className="sm:col-span-2">
                <span className="font-semibold">Awards: </span>
                <span>{awards}</span>
              </div>
            )}
          </div>

          {summary && (
            <div className="text-sm leading-relaxed whitespace-pre-line">{summary}</div>
          )}

          {/* Known for */}
          {knownFor.length > 0 && (
            <section className="pt-2">
              <h2 className="text-lg font-semibold mb-3">Known for</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {knownFor.map((m) => {
                  const mid = m?.id;
                  const mtitle = m?.title || m?.name || "";
                  const myear = m?.year || m?.release_year || "";
                  const mimg = m?.image ? getImageUrl(m.image) : "";

                  return (
                    <Link
                      key={mid || `${mtitle}-${myear}`}
                      to={mid ? `/movies/${mid}` : "#"}
                      className={`block overflow-hidden rounded-md border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105 ${mid ? "" : "pointer-events-none opacity-70"}`}
                      aria-label={mtitle ? `Open details for ${mtitle}` : "Movie"}
                      title={mtitle}
                    >
                      <div className="relative">
                        {mimg ? (
                          <img
                            src={mimg}
                            alt={mtitle}
                            className="aspect-[2/3] w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center text-muted-foreground">
                            No image
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-black/50 px-3 sm:px-4 py-2.5 sm:py-3 text-white">
                          <div className="text-sm sm:text-base font-semibold line-clamp-2">
                            {mtitle} {myear ? `(${myear})` : ""}
                          </div>
                          {m?.character ? (
                            <div className="mt-1 text-[11px] sm:text-xs opacity-90 line-clamp-1">
                              as {m.character}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}