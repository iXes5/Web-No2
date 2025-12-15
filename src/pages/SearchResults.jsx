import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchMovies,
  fetchPersonsPages,
  fetchPersonById,
  getImageUrl,
  uniqById,
} from "@/lib/moviesApi";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Cấu hình phạm vi tìm kiếm (khớp yêu cầu của bạn)
const SEARCH_CONFIG = {
  MOVIES_LIMIT: 100,   // mỗi page tối đa 100 phim
  MOVIES_MAX_PAGE: 50, // tối đa 50 trang cho search theo title
  PERSONS_PAGES: 20,   // fetch 20 trang persons
  PERSONS_LIMIT: 100,  // mỗi trang 100 persons
};

function MovieCard({ movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="block overflow-hidden rounded-md border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105"
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

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const query = (params.get("title") || "").trim();
  const page = Math.min(Number(params.get("page") || 1), SEARCH_CONFIG.MOVIES_MAX_PAGE);
  const limit = Number(params.get("limit") || SEARCH_CONFIG.MOVIES_LIMIT);

  const canSearch = useMemo(() => query.length > 0, [query]);

  // Group 1: Movies theo title (có phân trang)
  const [moviesByTitle, setMoviesByTitle] = useState([]);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [hasNextTitle, setHasNextTitle] = useState(false);

  // Group 2: Movies từ persons (known_for) khớp tên (không phân trang)
  const [moviesByPersons, setMoviesByPersons] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [errorPersons, setErrorPersons] = useState("");

  // Fetch movies theo title
  useEffect(() => {
    if (!canSearch) {
      setMoviesByTitle([]);
      setHasNextTitle(false);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        setLoadingTitle(true);
        setErrorTitle("");

        const data = await fetchMovies(
          `/movies/search?title=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
          { signal: controller.signal }
        );

        const rows = Array.isArray(data) ? data : [];
        setMoviesByTitle(rows);
        setHasNextTitle(rows.length === limit && page < SEARCH_CONFIG.MOVIES_MAX_PAGE);
      } catch (e) {
        if (e?.name !== "AbortError") setErrorTitle(e?.message || "Search movies failed");
      } finally {
        setLoadingTitle(false);
      }
    })();

    return () => controller.abort();
  }, [canSearch, query, page, limit]);

  // Fetch persons diện rộng, lọc theo tên, gom known_for
  useEffect(() => {
    if (!canSearch) {
      setMoviesByPersons([]);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        setLoadingPersons(true);
        setErrorPersons("");

        // 1) Lấy danh sách persons diện rộng
        const allPersons = await fetchPersonsPages(
          { pages: SEARCH_CONFIG.PERSONS_PAGES, limit: SEARCH_CONFIG.PERSONS_LIMIT },
          { signal: controller.signal }
        );
        console.log(allPersons);

        // 2) Lọc theo tên chứa query (không yêu cầu role)
        const qLower = query.toLowerCase();
        const matched = allPersons.filter((p) => (p?.name || "").toLowerCase().includes(qLower));

        if (matched.length === 0) {
          setMoviesByPersons([]);
          return;
        }

        // 3) Lấy chi tiết từng person để lấy known_for
        const details = await Promise.all(
          matched.map((p) => fetchPersonById(p.id, { signal: controller.signal }))
        );

        // 4) Gộp tất cả known_for và loại trùng theo id
        const allMovies = details.flatMap((d) => (Array.isArray(d?.known_for) ? d.known_for : []));
        setMoviesByPersons(uniqById(allMovies));
      } catch (e) {
        if (e?.name !== "AbortError") setErrorPersons(e?.message || "Search persons failed");
      } finally {
        setLoadingPersons(false);
      }
    })();

    return () => controller.abort();
  }, [canSearch, query]);

  function setPage(nextPage) {
    setParams((p) => {
      p.set("page", String(nextPage));
      p.set("limit", String(limit));
      p.set("title", query);
      return p;
    });
  }

  if (!canSearch) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
        <div className="py-12 text-center text-muted-foreground">
          Nhập từ khoá ở ô Search để tìm phim / diễn viên / đạo diễn.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
      <div className="mb-4 text-sm text-muted-foreground">
        Kết quả cho: <span className="font-medium text-foreground">{query}</span>
      </div>

      {/* Group 1: Movies theo title */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Movies matching title</h2>

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
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>

            {/* Pagination: Prev | (page / max) | Next */}
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => e.preventDefault()} isActive>
                      {page} / {SEARCH_CONFIG.MOVIES_MAX_PAGE}
                    </PaginationLink>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (hasNextTitle) setPage(page + 1);
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

      {/* Group 2: Movies từ persons */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Movies by persons matching "{query}"</h2>

        {loadingPersons ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : errorPersons ? (
          <div className="py-8 text-center text-destructive">{errorPersons}</div>
        ) : moviesByPersons.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Không có phim theo persons.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {moviesByPersons.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}