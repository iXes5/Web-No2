import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchMovies, getImageUrl } from "@/lib/moviesApi";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const APP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzXzMxIiwicm9sZSI6InVzZXIiLCJhcGlfYWNjZXNzIjp0cnVlLCJpYXQiOjE3NjUzNjE3NjgsImV4cCI6MTc3MDU0NTc2OH0.O4I48nov3NLaKDSBhrPe9rKZtNs9q2Tkv4yK0uMthoo";

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
  // trả về list page numbers và string "..." để render ellipsis
  if (total <= 1) return [1];

  const pages = [];
  const left = Math.max(1, current - delta);
  const right = Math.min(total, current + delta);

  // luôn có page 1
  pages.push(1);

  if (left > 2) pages.push("...");

  for (let p = left; p <= right; p++) {
    if (p !== 1 && p !== total) pages.push(p);
  }

  if (right < total - 1) pages.push("...");

  // luôn có page total
  if (total !== 1) pages.push(total);

  // loại trùng (trường hợp current sát biên)
  const out = [];
  for (const x of pages) {
    if (out.length && out[out.length - 1] === x) continue;
    out.push(x);
  }
  return out;
}

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const title = (params.get("title") || "").trim();
  const page = Number(params.get("page") || "1");
  const limit = Number(params.get("limit") || "10");

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // nếu API không trả totalPages/totalItems thì ta không biết total thật.
  // Mặc định hiển thị pagination "mở": cho Next nếu còn dữ liệu.
  const [hasNext, setHasNext] = useState(false);

  const canSearch = useMemo(() => title.length > 0, [title]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      if (!canSearch) {
        setMovies([]);
        setHasNext(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchMovies(
          `/movies/search?title=${encodeURIComponent(title)}&page=${page}&limit=${limit}`,
          { signal: controller.signal, token: APP_TOKEN }
        );

        setMovies(data);

        // nếu trả về đúng limit thì khả năng còn trang tiếp theo
        setHasNext(Array.isArray(data) && data.length === limit);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Search failed");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [canSearch, title, page, limit]);

  function setPage(nextPage) {
    setParams((p) => {
      p.set("page", String(nextPage));
      p.set("limit", String(limit));
      p.set("title", title);
      return p;
    });
  }

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
      {!canSearch ? (
        <div className="py-12 text-center text-muted-foreground">
          Nhập từ khoá ở ô Search để tìm phim.
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">{error}</div>
      ) : movies.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Không tìm thấy kết quả.
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Kết quả cho:{" "}
            <span className="font-medium text-foreground">{title}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {movies.map((m) => (
              <MovieGridCard key={m.id} movie={m} />
            ))}
          </div>

          {/* Pagination shadcn */}
          <div className="mt-8 flex justify-center">
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

                {/* Hiển thị vài trang xung quanh current (fallback khi chưa biết total) */}
                {rangePages(page, page + (hasNext ? 1 : 0), 1).map((p, idx) => {
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
                      if (!hasNext) return;
                      setPage(page + 1);
                    }}
                    className={!hasNext ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}
    </main>
  );
}