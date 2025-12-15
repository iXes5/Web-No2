import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPersonById, getImageUrl } from "@/lib/moviesApi";
import Spinner from "@/components/ui/spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const mounted = useRef(true);

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [kfPage, setKfPage] = useState(1);
  const KF_PAGE_SIZE = 3;

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();

    (async () => {
      try {
        if (!mounted.current) return;
        setLoading(true);
        setError("");

        const data = await fetchPersonById(id, { signal: controller.signal });
        if (!mounted.current) return;
        setPerson(data || null);
        setKfPage(1);
      } catch (e) {
        if (!mounted.current) return;
        if (e?.name !== "AbortError") setError(e?.message || "Failed to load person");
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();

    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [id]);

  const knownFor = useMemo(
    () => (Array.isArray(person?.known_for) ? person.known_for : []),
    [person]
  );

  // Clamp current page if data size shrinks when navigating quickly
  const kfTotalPages = Math.max(1, Math.ceil(knownFor.length / KF_PAGE_SIZE));
  useEffect(() => {
    if (kfPage > kfTotalPages) setKfPage(kfTotalPages);
  }, [kfPage, kfTotalPages]);

  const kfStartIdx = (kfPage - 1) * KF_PAGE_SIZE;
  const kfSlice = knownFor.slice(kfStartIdx, kfStartIdx + KF_PAGE_SIZE);

  if (loading) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
        <div className="py-12 flex justify-center">
          <Spinner size={28} />
        </div>
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

  const name = person?.name || "Unknown";
  const image = person?.image ? getImageUrl(person.image) : "";
  const role = person?.role || "N/A";
  const summary = person?.summary || "N/A";
  const birth = person?.birth_date ? fmtDate(person.birth_date) : "N/A";
  const death = person?.death_date ? fmtDate(person.death_date) : "—";
  const height = person?.height || "N/A";
  const awards = person?.awards || "N/A";

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-12">
      <div className="flex items-start gap-6">
        {/* Left: portrait */}
        <div className="shrink-0 w-[220px] sm:w-[260px] md:w-[300px]">
          <div className="overflow-hidden rounded-md border bg-card">
            {image ? (
              <img src={image} alt={name} className="w-full object-cover aspect-[2/3]" />
            ) : (
              <div className="w-full bg-muted aspect-[2/3]" />
            )}
          </div>
        </div>

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

          {knownFor.length > 0 && (
            <section className="pt-2">
              <h2 className="text-lg font-semibold mb-3">Known for</h2>

              <div className="grid grid-cols-3 gap-6">
                {kfSlice.map((m, idx) => {
                  const mid = m?.id;
                  const mtitle = m?.title || m?.name || "Untitled";
                  const myear = m?.year || m?.release_year || "";
                  const mimg = m?.image ? getImageUrl(m.image) : "";

                  return (
                    <Link
                      key={`${mid || mtitle}-${kfStartIdx + idx}`}
                      to={mid ? `/movies/${mid}` : "#"}
                      className="block overflow-hidden rounded-md border bg-card hover:scale-105 transition-transform"
                    >
                      {mimg ? (
                        <img
                          src={mimg}
                          alt={mtitle}
                          className="aspect-[2/3] w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="aspect-[2/3] w-full bg-muted" />
                      )}
                      <div className="px-3 py-2">
                        <div className="text-sm font-medium">
                          {mtitle} {myear ? `(${myear})` : ""}
                        </div>
                        {m?.character ? (
                          <div className="text-xs text-muted-foreground mt-0.5">as {m.character}</div>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>

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