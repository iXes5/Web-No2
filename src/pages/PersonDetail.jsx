import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPersonById, getImageUrl } from "@/lib/moviesApi";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Dùng đúng helper trong moviesApi → gọi /api/persons/:id

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

  // Pagination cho known_for: 6 phim / trang
  const [kfPage, setKfPage] = useState(1);
  const KF_PAGE_SIZE = 6;

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchPersonById(id, { signal: controller.signal });
        console.log("[PersonDetail] data", data);
        setPerson(data || null);
        setKfPage(1);
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

  const name = person.name || "Unknown";
  const image = person.image ? getImageUrl(person.image) : "";
  const role = person.role || "N/A";
  const summary = person.summary || "N/A";
  const birth = person.birth_date ? fmtDate(person.birth_date) : "N/A";
  const death = person.death_date ? fmtDate(person.death_date) : "—";
  const height = person.height || "N/A";
  const awards = person.awards || "N/A";
  const knownFor = Array.isArray(person.known_for) ? person.known_for : [];

  // Slice known_for theo pagination
  const kfTotalPages = Math.max(1, Math.ceil(knownFor.length / KF_PAGE_SIZE));
  const kfStartIdx = (kfPage - 1) * KF_PAGE_SIZE;
  const kfSlice = knownFor.slice(kfStartIdx, kfStartIdx + KF_PAGE_SIZE);

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-12">
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

        {/* Thông tin phải */}
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

          {/* Known for với pagination: 6 phim / trang, 3 phim / hàng */}
          {knownFor.length > 0 && (
            <section className="pt-2">
              <h2 className="text-lg font-semibold mb-3">Known for</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {kfSlice.map((m) => (
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

              {/* Pagination cho known_for */}
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setKfPage((p) => Math.max(1, p - 1));
                        }}
                        className={kfPage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationLink href="#" onClick={(e) => e.preventDefault()} isActive>
                        {kfPage} / {kfTotalPages}
                      </PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setKfPage((p) => Math.min(kfTotalPages, p + 1));
                        }}
                        className={kfPage >= kfTotalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}