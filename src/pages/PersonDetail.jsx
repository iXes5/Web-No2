import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { APP_TOKEN, getImageUrl } from "@/lib/moviesApi";

// Cache để tránh gọi lại /api/person/:id nếu backend chưa hỗ trợ (giảm 404 về sau)
let PERSON_ENDPOINT_AVAILABLE = undefined; // undefined = chưa biết, true = dùng /api/person, false = dùng /api/persons

function ImageWithFallback({ src, alt, className }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={`aspect-[2/3] w-full bg-muted flex items-center justify-center text-xs text-muted-foreground`}>
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
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
function titleCase(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
function roleFromKnownFor(knownFor = []) {
  const roles = new Set();
  for (const k of knownFor || []) {
    if (k?.role) roles.add(titleCase(String(k.role)));
  }
  return Array.from(roles).join(", ");
}

// Ưu tiên đúng API bạn muốn (/api/person/:id). Nếu 404 lần đầu, cache lại và fallback dùng /api/persons/:id cho các lần sau.
async function fetchPersonSmart(id, { signal }) {
  // Nếu chưa biết, thử /api/person trước
  if (PERSON_ENDPOINT_AVAILABLE !== false) {
    try {
      const res = await fetch(`/api/person/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
          "x-app-token": APP_TOKEN,
          Accept: "application/json",
        },
        signal,
      });
      if (res.ok) {
        PERSON_ENDPOINT_AVAILABLE = true;
        const data = await res.json();
        console.log("[PersonDetail] via /person/:id", data);
        return data;
      }
      // Nếu 404 (chưa có route), chuyển sang dùng /api/persons về sau
      if (res.status === 404) {
        PERSON_ENDPOINT_AVAILABLE = false;
        // Không throw để tránh nhảy vào UI error; tiếp tục fallback
      } else {
        // Lỗi khác ngoài 404
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }
    } catch (e) {
      // Network/Abort thì ném tiếp (UI sẽ xử lý)
      if (e?.name === "AbortError") throw e;
      // Lỗi khác: thử fallback
      PERSON_ENDPOINT_AVAILABLE ??= false;
    }
  }

  // Fallback: /api/persons/:id
  const res2 = await fetch(`/api/persons/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      "x-app-token": APP_TOKEN,
      Accept: "application/json",
    },
    signal,
  });
  if (!res2.ok) {
    const text = await res2.text().catch(() => "");
    throw new Error(`HTTP ${res2.status}: ${text || res2.statusText}`);
  }
  const data2 = await res2.json();
  console.log("[PersonDetail] via /persons/:id", data2);
  return data2;
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
        const data = await fetchPersonSmart(id, { signal: controller.signal });
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

  // Normalize & fallback khi thiếu dữ liệu
  const name = person.name || "Unknown";
  const knownFor = toArray(person.known_for);
  const role = person.role || roleFromKnownFor(knownFor);
  const image = person.image ? getImageUrl(person.image) : "";
  const summary = person.summary || "";
  const birth = person.birth_date ? formatDate(person.birth_date) : "";
  const death = person.death_date ? formatDate(person.death_date) : "";
  const height = person.height || "";
  const awards = person.awards || "";

  const hasAnyPersonalInfo = Boolean(role || height || birth || death || awards || summary);

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-12">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{name}</span>
      </div>

      {/* Layout: ảnh trái, thông tin phải */}
      <div className="flex items-start gap-6">
        <div className="shrink-0 w-[220px] sm:w-[260px] md:w-[300px]">
          <div className="overflow-hidden rounded-md border bg-card">
            <ImageWithFallback src={image} alt={name} className="aspect-[2/3] w-full object-cover" />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <h1 className="text-2xl font-semibold">{name}</h1>

          {hasAnyPersonalInfo ? (
            <>
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
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No personal information available for this person.
            </div>
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
                  const mchar = m?.character;

                  return (
                    <Link
                      key={mid || `${mtitle}-${myear}`}
                      to={mid ? `/movies/${mid}` : "#"}
                      className={`block overflow-hidden rounded-md border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105 ${mid ? "" : "pointer-events-none opacity-70"}`}
                      aria-label={mtitle ? `Open details for ${mtitle}` : "Movie"}
                      title={mtitle}
                    >
                      <div className="relative">
                        <ImageWithFallback src={mimg} alt={mtitle} className="aspect-[2/3] w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 px-3 sm:px-4 py-2.5 sm:py-3 text-white">
                          <div className="text-sm sm:text-base font-semibold line-clamp-2">
                            {mtitle} {myear ? `(${myear})` : ""}
                          </div>
                          {mchar ? (
                            <div className="mt-1 text-[11px] sm:text-xs opacity-90 line-clamp-1">
                              as {mchar}
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