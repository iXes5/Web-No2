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
import Spinner from "@/components/ui/spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Hiển thị 9 phim một trang (3 x 3) cho cả 2 nhóm UI
const UI_PAGE_SIZE = 9;

// Fetch persons diện rộng
const PERSONS_FETCH = { PAGES: 20, LIMIT: 100 };

// Tạo dãy số trang (tối đa 9 nút) quanh trang hiện tại
function getPageRange(current, total, maxButtons = 9) {
  if (!total || total < 1) return [1];
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

// Chuẩn hóa movie để card thống nhất
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
  return { id: m?.id, title, year, image, genres, rate };
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

  // UI page (9 phim/trang) cho group "Movies matching title"
  const uiPage = Math.max(1, Number(params.get("page") || 1));
  const canSearch = useMemo(() => query.length > 0, [query]);

  // Group 1: Movies theo title (server trả theo page/limit, mình dùng limit=9)
  const [moviesByTitle, setMoviesByTitle] = useState([]);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [titleTotalPages, setTitleTotalPages] = useState(1);

  // Group 2: Movies từ persons (lọc persons có keyword TRONG name), client-side pagination 9/trang
  const [moviesByPersons, setMoviesByPersons] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [errorPersons, setErrorPersons] = useState("");
  const [personsPage, setPersonsPage] = useState(1);

  // Movies matching title: gọi API với limit=9
  useEffect(() => {
    if (!canSearch) {
      setMoviesByTitle([]);
      setTitleTotalPages(1);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingTitle(true);
        setErrorTitle("");

        const { data, pagination } = await fetchPaged(
          `/movies/search?title=${encodeURIComponent(query)}&page=${uiPage}&limit=${UI_PAGE_SIZE}`,
          { signal: controller.signal }
        );

        setMoviesByTitle(Array.isArray(data) ? data : []);

        if (pagination && typeof pagination.total_pages === "number") {
          setTitleTotalPages(Math.max(1, Number(pagination.total_pages)));
        } else if (pagination && typeof pagination.total_items === "number") {
          const total = Math.ceil(Math.max(0, Number(pagination.total_items)) / UI_PAGE_SIZE);
          setTitleTotalPages(Math.max(1, total));
        } else {
          const totalGuess =
            data && Array.isArray(data) ? (data.length === UI_PAGE_SIZE ? uiPage + 1 : uiPage) : 1;
          setTitleTotalPages(Math.max(1, totalGuess));
        }
      } catch (e) {
        if (e?.name !== "AbortError") {
          setErrorTitle(e?.message || "Search movies failed");
          setMoviesByTitle([]);
          setTitleTotalPages(1);
        }
      } finally {
        setLoadingTitle(false);
      }
    })();
    return () => controller.abort();
  }, [canSearch, query, uiPage]);

  // Movies by persons named: fetch persons rộng, LỌC những person có keyword TRONG name (case-insensitive, includes),
  // rồi fetch chi tiết từng person đó để lấy known_for, gộp lại thành danh sách phim.
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

        // 1) Lấy diện rộng danh sách persons
        const allPersons = await fetchPersonsPages(
          { pages: PERSONS_FETCH.PAGES, limit: PERSONS_FETCH.LIMIT },
          { signal: controller.signal }
        );

        // 2) Lọc person có keyword trong name (case-insensitive, includes)
        const qLower = query.toLowerCase();
        const matchedPersons = allPersons.filter((p) =>
          (p?.name || "").toLowerCase().includes(qLower)
        );

        if (!matchedPersons.length) {
          setMoviesByPersons([]);
          setPersonsPage(1);
          return;
        }

        // 3) Lấy chi tiết từng person để có known_for
        const details = await Promise.all(
          matchedPersons.map((p) => fetchPersonById(p.id, { signal: controller.signal }))
        );

        // 4) Gộp tất cả known_for rồi loại trùng theo movie id
        const allMoviesRaw = details.flatMap((d) =>
          Array.isArray(d?.known_for) ? d.known_for : []
        );

        const normalized = uniqById(allMoviesRaw.map(normalizeMovie));
        setMoviesByPersons(normalized);
        setPersonsPage(1); // reset trang khi đổi query
      } catch (e) {
        if (e?.name !== "AbortError") setErrorPersons(e?.message || "Search persons failed");
      } finally {
        setLoadingPersons(false);
      }
    })();
    return () => controller.abort();
  }, [canSearch, query]);

  // Helpers: set UI page (server-side, limit=9)
  function setTitlePage(nextPage) {
    const safe = Math.max(1, Math.min(nextPage, titleTotalPages || 1));
    setParams((p) => {
      p.set("page", String(safe));
      p.set("title", query);
      return p;
    });
  }

  // Client-side pagination cho persons (9 phim/trang)
  const personsTotalPages = Math.max(1, Math.ceil(moviesByPersons.length / UI_PAGE_SIZE));
  const personsStartIdx = (personsPage - 1) * UI_PAGE_SIZE;
  const personsSlice = moviesByPersons.slice(personsStartIdx, personsStartIdx + UI_PAGE_SIZE);

  // Tối đa 9 nút số trang
  const titlePageNumbers = getPageRange(uiPage, titleTotalPages, 9);
  const personsPageNumbers = getPageRange(personsPage, personsTotalPages, 9);

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

      {/* Group 1: Movies matching title (9 phim/trang) */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Movies matching title</h2>

        {loadingTitle ? (
          <div className="py-8 flex justify-center">
            <Spinner size={24} label="Loading movies" />
          </div>
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

            {/* Pagination: tối đa 9 nút số trang */}
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (uiPage > 1) setTitlePage(uiPage - 1);
                      }}
                      className={uiPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {titlePageNumbers.map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (p !== uiPage) setTitlePage(p);
                        }}
                        isActive={p === uiPage}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (uiPage < titleTotalPages) setTitlePage(uiPage + 1);
                      }}
                      className={uiPage >= titleTotalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </section>

      {/* Group 2: Movies by persons named "{query}" (9 phim/trang) */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Movies by persons named "{query}"</h2>

        {loadingPersons ? (
          <div className="py-8 flex justify-center">
            <Spinner size={24} label="Loading persons movies" />
          </div>
        ) : errorPersons ? (
          <div className="py-8 text-center text-destructive">{errorPersons}</div>
        ) : moviesByPersons.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Không có phim theo persons trùng tên.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {personsSlice.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>

            {/* Pagination: tối đa 9 nút số trang */}
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

                  {personsPageNumbers.map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (p !== personsPage) setPersonsPage(p);
                        }}
                        isActive={p === personsPage}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

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