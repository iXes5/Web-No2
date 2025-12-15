import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getImageUrl, fetchMovieById } from "@/lib/moviesApi";

// Helpers gọn
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const unique = (arr) => Array.from(new Set(arr));

function pickSummary(m) {
  return m?.summary || m?.short_description || m?.plot || m?.description || "";
}

function pickGenres(m) {
  const g = m?.genres ?? m?.genre ?? [];
  return unique(
    toArray(g)
      .map((x) => (typeof x === "string" ? x : x?.name || null))
      .filter(Boolean)
  );
}

function pickPeople(m, keys = []) {
  // Lấy từ các key (director(s), actor(s)/cast/stars)
  const fromKeys = unique(
    keys
      .flatMap((k) => toArray(m?.[k]))
      .map((x) => (typeof x === "string" ? x : x?.name || null))
      .filter(Boolean)
  );

  // Lấy thêm từ credits (nếu có)
  const credits = Array.isArray(m?.credits) ? m.credits : [];
  const fromCredits = unique(
    credits
      .map((c) => (typeof c?.name === "string" ? c.name : null))
      .filter(Boolean)
  );

  return unique([...fromKeys, ...fromCredits]);
}

function pickRolePeople(m, roleKeywords = []) {
  const credits = Array.isArray(m?.credits) ? m.credits : [];
  const kws = roleKeywords.map((k) => String(k).toLowerCase());
  return unique(
    credits
      .filter((c) => {
        const r = String(c?.role || "").toLowerCase();
        return kws.some((k) => r.includes(k));
      })
      .map((c) => c?.name)
      .filter(Boolean)
  );
}

export default function MoviesDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchMovieById(id, { signal: controller.signal });
        setMovie(data || null);
      } catch (e) {
        if (e?.name !== "AbortError") setError(e?.message || "Failed to fetch movie");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  const { title, year, image, genres, summary, directors, cast } = useMemo(() => {
    const t = movie?.title || movie?.name || "Untitled";
    const y = movie?.year || movie?.release_year || "";
    const img = movie?.image ? getImageUrl(movie.image) : "";
    const g = pickGenres(movie);
    const s = pickSummary(movie);

    const dir = unique([
      ...pickPeople(movie, ["directors", "director"]),
      ...pickRolePeople(movie, ["director"]),
    ]);

    const actors = unique([
      ...pickPeople(movie, ["actors", "cast", "stars"]),
      ...pickRolePeople(movie, ["actor", "cast"]),
    ]);

    return { title: t, year: y, image: img, genres: g, summary: s, directors: dir, cast: actors };
  }, [movie]);

  if (loading) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
        <div className="py-12 text-center text-destructive">{error}</div>
      </main>
    );
  }

  if (!movie) return null;

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-12">
      {/* Ảnh bên trái, thông tin bên phải */}
      <div className="flex items-start gap-6">
        {/* Trái: Poster lớn hơn */}
        <div className="shrink-0 w-[240px] sm:w-[300px] md:w-[360px]">
          <div className="overflow-hidden rounded-md border bg-card">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-full object-cover aspect-[2/3]"
              />
            ) : (
              <div className="w-full bg-muted aspect-[2/3]" />
            )}
          </div>
        </div>

        {/* Phải: Thông tin chi tiết */}
        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="text-2xl font-semibold">
            {title} {year ? <span className="text-muted-foreground text-xl">({year})</span> : null}
          </h1>

          {genres?.length ? (
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs bg-secondary text-secondary-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}

          {summary ? <p className="text-sm leading-relaxed">{summary}</p> : null}

          {/* Director & Cast (Cast nằm dưới Director) */}
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold">Director</div>
              <div className="mt-1 text-sm text-foreground">
                {directors?.length ? directors.join(", ") : <span className="text-muted-foreground">N/A</span>}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Cast</div>
              <div className="mt-1 text-sm text-foreground">
                {cast?.length ? cast.join(", ") : <span className="text-muted-foreground">N/A</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}