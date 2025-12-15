import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchMovies,
  fetchPersonsByName,
  fetchPersonById,
  getImageUrl,
  uniqById,
} from "@/lib/moviesApi";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function MovieGridCard({ movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="block overflow-hidden rounded-md border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={`Open details for ${movie.title}`}
      title={movie.title}
    >
      {movie.image ? (
        <img
          src={getImageUrl(movie.image)}
          alt={movie.title}
          className="aspect-[2/3] w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center text-muted-foreground">
          No image
        </div>
      )}

      <div className="bg-white text-foreground px-3 py-2 text-center">
        <div className="text-sm font-medium leading-snug">
          {movie.title} {movie.year ? `(${movie.year})` : ""}
        </div>

        {movie.genres ? (
          <div className="mt-1 text-[11px] italic text-muted-foreground line-clamp-1">
            {Array.isArray(movie.genres) ? movie.genres.join(", ") : movie.genres}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function rangePages(current, total, delta = 1) {
  if (total <= 1) return [1];

  const pages = [];
  const left = Math.max(1, current - delta);
  const right = Math.min(total, current + delta);

  pages.push(1);
  if (left > 2) pages.push("...");

  for (let p = left; p <= right; p++) {
    if (p !== 1 && p !== total) pages.push(p);
  }

  if (right < total - 1) pages.push("...");
  if (total !== 1) pages.push(total);

  const out = [];
  for (const x of pages) {
    if (out.length && out[out.length - 1] === x) continue;
    out.push(x);
  }
  return out;
}

function isDirector(person) {
  // role ví dụ: "Actor, Director"
  return typeof person?.role === "string" && person.role.toLowerCase().includes("director");
}

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("title") || "").trim();
  const page = Number(params.get("page") || "1");
  const limit = Number(params.get("limit") || "10");

  // group 1: movies by title
  const [moviesByTitle, setMoviesByTitle] = useState([]);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [hasNextTitle, setHasNextTitle] = useState(false);

  // group 2: movies by directors
  const [moviesByDirectors, setMoviesByDirectors] = useState([]);
  const [loadingDirectors, setLoadingDirectors] = useState(false);
  const [errorDirectors, setErrorDirectors] = useState("");

  const canSearch = useMemo(() => q.length > 0, [q]);

  // Fetch group 1 (giữ nguyên phân trang như cũ)
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      if (!canSearch) {
        setMoviesByTitle([]);
        setHasNextTitle(false);
        return;
      }

      try {
        setLoadingTitle(true);
        setErrorTitle("");

        const data = await fetchMovies(
          `/movies/search?title=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
          { signal: controller.signal }
        );

        setMoviesByTitle(data);
        setHasNextTitle(Array.isArray(data) && data.length === limit);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setErrorTitle(e?.message || "Search movies failed");
      } finally {
        setLoadingTitle(false);
      }
    }

    load();
    return () => controller.abort();
  }, [canSearch, q, page, limit]);

  // Fetch group 2 (director name contains query)
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      if (!canSearch) {
        setMoviesByDirectors([]);
        return;
      }

      try {
        setLoadingDirectors(true);
        setErrorDirectors("");

        // 1) tìm persons theo name
        // bạn có thể tăng limit lên 20/50 nếu muốn bắt nhiều đạo diễn hơn
        const personsRes = await fetchPersonsByName(
          { name: q, page: 1, limit: 10 },
          { signal: controller.signal }
        );

        const directors = (personsRes.data || []).filter(isDirector);

        if (directors.length === 0) {
          setMoviesByDirectors([]);
          return;
        }

        // 2) lấy detail từng director để lấy known_for
        const details = await Promise.all(
          directors.map((p) => fetchPersonById(p.id, { signal: controller.signal }))
        );

        // 3) gom phim mà role là director (nếu backend có role field theo từng movie)
        const directorMovies = details.flatMap((d) => {
          const list = Array.isArray(d?.known_for) ? d.known_for : [];
          return list.filter((m) => {
            // nếu API trả role: "actor"/"director"
            if (typeof m?.role === "string") return m.role.toLowerCase() === "director";
            // fallback: nếu không có role thì cứ lấy hết known_for
            return true;
          });
        });

        setMoviesByDirectors(uniqById(directorMovies));
      } catch (e) {
        if (e?.name === "AbortError") return;
        setErrorDirectors(e?.message || "Search directors failed");
      } finally {
        setLoadingDirectors(false);
      }
    }

    // khi q đổi thì load lại; không phụ thuộc page/limit vì group 2 không phân trang theo movies
    load();
    return () => controller.abort();
  }, [canSearch, q]);

  function setPage(nextPage) {
    setParams((p) => {
      p.set("page", String(nextPage));
      p.set("limit", String(limit));
      p.set("title", q);
      return p;
    });
  }

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
      {!canSearch ? (
        <div className="py-12 text-center text-muted-foreground">
          Nhập từ khoá ở ô Search để tìm phim / đạo diễn.
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Kết quả cho: <span className="font-medium text-foreground">{q}</span>
          </div>

          {/* Group 1 */}
          <section>
            <div className="mb-3 text-lg font-semibold">Movies matching title</div>

            {loadingTitle ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : errorTitle ? (
              <div className="py-8 text-center text-destructive">{errorTitle}</div>
            ) : moviesByTitle.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Không có phim theo title.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {moviesByTitle.map((m) => (
                    <MovieGridCard key={m.id} movie={m} />
                  ))}
                </div>

                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page <= 1) return;
                            setPage(page - 1);
                          }}
                          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {rangePages(page, page + (hasNextTitle ? 1 : 0), 1).map((p, idx) => {
                        if (p === "...") {
                          return (
                            <PaginationItem key={`e-${idx}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={p === page}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!hasNextTitle) return;
                            setPage(page + 1);
                          }}
                          className={!hasNextTitle ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </section>

          {/* Group 2 */}
          <section className="mt-10">
            <div className="mb-3 text-lg font-semibold">
              Movies by directors matching “{q}”
            </div>

            {loadingDirectors ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : errorDirectors ? (
              <div className="py-8 text-center text-destructive">{errorDirectors}</div>
            ) : moviesByDirectors.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Không có phim theo đạo diễn (tên đạo diễn chứa từ khoá).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {moviesByDirectors.map((m) => (
                  <MovieGridCard key={m.id} movie={m} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}