import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchMovies, getImageUrl } from "@/lib/moviesApi";

const APP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzXzMxIiwicm9sZSI6InVzZXIiLCJhcGlfYWNjZXNzIjp0cnVlLCJpYXQiOjE3NjUzNjE3NjgsImV4cCI6MTc3MDU0NTc2OH0.O4I48nov3NLaKDSBhrPe9rKZtNs9q2Tkv4yK0uMthoo";

function MovieGridCard({ movie }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
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

      <div className="px-3 py-2">
        <div className="text-sm font-medium line-clamp-1">
          {movie.title} {movie.year ? `(${movie.year})` : ""}
        </div>
      </div>
    </div>
  );
}

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const title = (params.get("title") || "").trim();
  const page = Number(params.get("page") || "1");
  const limit = Number(params.get("limit") || "10");

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSearch = useMemo(() => title.length > 0, [title]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      if (!canSearch) {
        setMovies([]);
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

  function prevPage() {
    setParams((p) => {
      p.set("page", String(Math.max(1, page - 1)));
      return p;
    });
  }

  function nextPage() {
    setParams((p) => {
      p.set("page", String(page + 1));
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

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              onClick={prevPage}
              disabled={page <= 1}
            >
              Prev
            </button>
            <div className="text-sm text-muted-foreground">Page {page}</div>
            <button
              className="rounded-md border px-3 py-2 text-sm"
              onClick={nextPage}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}