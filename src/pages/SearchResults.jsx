import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import {
  fetchPaged,
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

// Cấu hình phạm vi tìm kiếm
const SEARCH_CONFIG = {
  MOVIES_LIMIT: 9,     // mỗi page 9 phim (3 cột x 3 hàng)
  MOVIES_MAX_PAGE: 50, // giới hạn an toàn tối đa (fallback khi không có pagination từ API)
  PERSONS_PAGES: 20,   // fetch 20 trang persons
  PERSONS_LIMIT: 100,  // mỗi trang 100 persons
  PERSONS_PAGE_SIZE: 9,// pagination client-side: 9 phim / trang
};

// Chuẩn hóa movie để card của group "persons" hiển thị giống hệt group "movies"
function normalizeMovie(m) {
  const title = m?.title ?? m?.name ?? "";
  const year = m?.year ?? m?.release_year ?? "";
  const image = m?.image ?? "";
  let genres = [];
  if (Array.isArray(m?.genres)) genres = m.genres;
  else if (typeof m?.genres === "string") {
    genres = m.genres.split(",").map((s) => s.trim()).filter(Boolean);
  }
  let rate = null;
  if (typeof m?.rate === "number") rate = m.rate;
  else if (typeof m?.rate === "string" && m.rate.trim() !== "") rate = m.rate;

  return {
    id: m?.id,
    title,
    year,
    image,
    genres,
    rate,
  };
}

function MovieCard({ movie }) {
  const rate =
    typeof movie.rate === "number"
      ? movie.rate
      : typeof movie.rate === "string"
      ? movie.rate
      : null;

  return (
    <Link
      to={`/movies/${movie.id}`}
      className="block overflow-hidden rounded-md border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105"
      aria-label={`Open details for ${movie.title}`}
      title={movie.title}
    >
      <div className="relative">
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

        {rate !== null && (
          <div className="absolute left-2 bottom-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{rate}</span>
          </div>
        )}
      </div>

      <div className="bg-white text-foreground px-3 py-2 text-center">
        <div className="text-sm font-medium leading-snug">
          {movie.title} {movie.year ? `(${movie.year})` : ""}
        </div>
        {movie.genres?.length ? (
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
  const page = Math.max(1, Number(params.get("page") || 1));
  const limit = Number(params.get("limit") || SEARCH_CONFIG.MOVIES_LIMIT);

  const canSearch = useMemo(() => query.length > 0, [query]);

  // Group 1: Movies theo title (có phân trang server)
  const [moviesByTitle, setMoviesByTitle] = useState([]);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [hasNextTitle, setHasNextTitle] = useState(false);
  const [titleTotalPages, setTitleTotalPages] = useState(1);

  // Group 2: Movies từ persons (known_for) khớp tên (phân trang client-side)
  const [moviesByPersons, setMoviesByPersons] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [errorPersons, setErrorPersons] = useState("");
  const [personsPage, setPersonsPage] = useState(1);

  // Fetch movies theo title (dùng fetchPaged để lấy pagination chính xác từ API)
  useEffect(() => {
    if (!canSearch) {
      setMoviesByTitle([]);
      setHasNextTitle(false);
      setTitleTotalPages(1);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        setLoadingTitle(true);
        setErrorTitle("");

        const { data, pagination } = await fetchPaged(
          `/movies/search?title=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
          { signal: controller.signal }
        );

        const rows = Array.isArray(data) ? data : [];
        setMoviesByTitle(rows);

        // Nếu API trả pagination, dùng total_pages từ server
        if (pagination && typeof pagination.total_pages === "number") {
          const total = Math.max(1, Number(pagination.total_pages));
          setTitleTotalPages(total);
          setHasNextTitle(page < total);
        } else {
          // Fallback khi không có pagination từ API
          const mightHaveNext = rows.length === limit;
          setHasNextTitle(mightHaveNext);
          setTitleTotalPages(mightHaveNext ? page + 1 : page);
        }
      } catch (e) {
        if (e?.name !== "AbortError") {
          setErrorTitle(e?.message || "Search movies failed");
          setMoviesByTitle([]);
          setHasNextTitle(false);
          setTitleTotalPages(1);
        }
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
      setPersonsPage(1);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        setLoadingPersons(true);
        setErrorPersons("");

        const allPersons = await fetchPersonsPages(
          { pages: SEARCH_CONFIG.PERSONS_PAGES, limit: SEARCH_CONFIG.PERSONS_LIMIT },
          { signal: controller.signal }
        );

        const qLower = query.toLowerCase();
        const matched = allPersons.filter((p) => (p?.name || "").toLowerCase().includes(qLower));

        if (matched.length === 0) {
          setMoviesByPersons([]);
          setPersonsPage(1);
          return;
        }

        const details = await Promise.all(
          matched.map((p) => fetchPersonById(p.id, { signal: controller.signal }))
        );

        const allMoviesRaw = details.flatMap((d) =>
          Array.isArray(d?.known_for) ? d.known_for : []
        );

        const normalized = uniqById(allMoviesRaw.map(normalizeMovie));
        setMoviesByPersons(normalized);
        setPersonsPage(1); // reset về trang 1 khi query thay đổi
      } catch (e) {
        if (e?.name !== "AbortError") setErrorPersons(e?.message || "Search persons failed");
      } finally {
        setLoadingPersons(false);
      }
    })();

    return () => controller.abort();
  }, [canSearch, query]);

  // Helpers: set page cho group title
  function setTitlePage(nextPage) {
    const safe = Math.max(1, Math.min(nextPage, titleTotalPages || 1));
    setParams((p) => {
      p.set("page", String(safe));
      p.set("limit", String(limit));
      p.set("title", query);
      return p;
    });
  }

  // Client-side pagination cho persons movies
  const personsTotalPages = Math.max(
    1,
    Math.ceil(moviesByPersons.length / SEARCH_CONFIG.PERSONS_PAGE_SIZE)
  );
  const personsStartIdx = (personsPage - 1) * SEARCH_CONFIG.PERSONS_PAGE_SIZE;
  const personsSlice = moviesByPersons.slice(
    personsStartIdx,
    personsStartIdx + SEARCH_CONFIG.PERSONS_PAGE_SIZE
  );

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

            {/* Pagination cho group title: 9 phim / trang, tổng trang từ API */}
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setTitlePage(page - 1);
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => e.preventDefault()} isActive>
                      {page} / {titleTotalPages}
                    </PaginationLink>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (hasNextTitle) setTitlePage(page + 1);
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {personsSlice.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>

            {/* Pagination cho group persons: 9 phim / trang */}
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPersonsPage((p) => Math.max(1, p - 1));
                      }}
                      className={personsPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => e.preventDefault()} isActive>
                      {personsPage} / {personsTotalPages}
                    </PaginationLink>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPersonsPage((p) => Math.min(personsTotalPages, p + 1));
                      }}
                      className={personsPage >= personsTotalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </section>
    </main>
  );
}