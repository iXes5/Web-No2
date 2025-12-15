import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchMovieById, getImageUrl } from "@/lib/moviesApi";

// Helpers đơn giản
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const stripHtml = (html) => (html ? String(html).replace(/<[^>]*>/g, "").trim() : "");
const uniqueByIdOrName = (items) => {
  const map = new Map();
  for (const i of items) {
    const key = i?.id || i?.name;
    if (key) map.set(key, i);
  }
  return Array.from(map.values());
};

// Chuẩn hoá mảng người {id?, name?} từ string | {id,name} | mixed
function toPeople(input) {
  return toArray(input)
    .map((x) => {
      if (!x) return null;
      if (typeof x === "string") return { id: null, name: x };
      if (typeof x?.name === "string") return { id: x.id ?? null, name: x.name };
      return null;
    })
    .filter(Boolean);
}

export default function MoviesDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchMovieById(id, { signal: controller.signal });
        setMovie(data || null);
      } catch (e) {
        if (e?.name !== "AbortError") setError(e?.message || "Failed to load movie");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (error || !movie) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
        <div className="py-12 text-center text-destructive">{error || "Movie not found"}</div>
      </main>
    );
  }

  // Dữ liệu hiển thị
  const title = movie.title || "Untitled";
  const fullTitle = movie.full_title || "";
  const year = movie.year || "";
  const poster = movie.image ? getImageUrl(movie.image) : "";
  const runtime = movie.runtime || "";
  const awards = movie.awards || "";
  const countries = Array.isArray(movie.countries) ? movie.countries : [];
  const languages = Array.isArray(movie.languages) ? movie.languages : [];
  const genres = Array.isArray(movie.genres) ? movie.genres : [];

  // Lấy directors, actors dưới dạng {id?, name}
  const directors = uniqueByIdOrName(toPeople(movie.directors ?? movie.director));
  const cast = uniqueByIdOrName(toPeople(movie.actors ?? movie.cast ?? movie.stars));

  // Ratings & Box office (tuỳ chọn)
  const ratings = movie.ratings || {};
  const boxOffice = movie.box_office || {};

  // Plot để CUỐI CÙNG
  const plot =
    movie.summary || movie.short_description || stripHtml(movie.plot_full || "");

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-12">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{title}</span>
      </div>

      {/* Ảnh bên trái, thông tin bên phải */}
      <div className="flex items-start gap-6">
        {/* Poster bên trái */}
        <div className="shrink-0 w-[260px] sm:w-[320px] md:w-[360px]">
          <div className="overflow-hidden rounded-md border bg-card">
            {poster ? (
              <img
                src={poster}
                alt={title}
                className="w-full object-cover aspect-[2/3]"
              />
            ) : (
              <div className="w-full bg-muted aspect-[2/3]" />
            )}
          </div>
        </div>

        {/* Thông tin bên phải */}
        <div className="min-w-0 flex-1 space-y-5">
          <h1 className="text-2xl font-semibold">
            {title} {year ? <span className="text-muted-foreground text-xl">({year})</span> : null}
          </h1>

          {/* Thông tin ngắn hữu ích */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fullTitle && (
              <div className="text-sm">
                <span className="font-semibold">Full title: </span>
                <span>{fullTitle}</span>
              </div>
            )}
            {runtime && (
              <div className="text-sm">
                <span className="font-semibold">Runtime: </span>
                <span>{runtime}</span>
              </div>
            )}
            {countries.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold">Countries: </span>
                <span>{countries.join(", ")}</span>
              </div>
            )}
            {languages.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold">Languages: </span>
                <span>{languages.join(", ")}</span>
              </div>
            )}
            {awards && (
              <div className="text-sm sm:col-span-2">
                <span className="font-semibold">Awards: </span>
                <span>{awards}</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
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
          )}

          {/* Director & Cast: item có id → Link tới /person/:id, không có id → span */}
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold">Director</div>
              <div className="mt-1 text-sm flex flex-wrap gap-x-2 gap-y-1">
                {directors.length ? (
                  directors.map((p, idx) =>
                    p.id ? (
                      <Link
                        key={p.id}
                        to={`/person/${p.id}`}
                        className="text-primary hover:underline"
                      >
                        {p.name}
                        {idx < directors.length - 1 ? "," : ""}
                      </Link>
                    ) : (
                      <span key={`${p.name}-${idx}`}>
                        {p.name}
                        {idx < directors.length - 1 ? "," : ""}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Cast</div>
              <div className="mt-1 text-sm flex flex-wrap gap-x-2 gap-y-1">
                {cast.length ? (
                  cast.map((p, idx) =>
                    p.id ? (
                      <Link
                        key={p.id}
                        to={`/person/${p.id}`}
                        className="text-primary hover:underline"
                      >
                        {p.name}
                        {idx < cast.length - 1 ? "," : ""}
                      </Link>
                    ) : (
                      <span key={`${p.name}-${idx}`}>
                        {p.name}
                        {idx < cast.length - 1 ? "," : ""}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
          </div>

          {/* Ratings */}
          {(ratings.imDb ||
            ratings.metacritic ||
            ratings.theMovieDb ||
            ratings.filmAffinity ||
            ratings.rottenTomatoes) && (
            <div>
              <div className="text-sm font-semibold mb-1">Ratings</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {ratings.imDb && <span className="rounded-md border px-2 py-0.5 bg-card">IMDb: {ratings.imDb}</span>}
                {ratings.metacritic && <span className="rounded-md border px-2 py-0.5 bg-card">Metacritic: {ratings.metacritic}</span>}
                {ratings.theMovieDb && <span className="rounded-md border px-2 py-0.5 bg-card">TMDb: {ratings.theMovieDb}</span>}
                {ratings.rottenTomatoes && <span className="rounded-md border px-2 py-0.5 bg-card">Rotten Tomatoes: {ratings.rottenTomatoes}%</span>}
                {ratings.filmAffinity && <span className="rounded-md border px-2 py-0.5 bg-card">FilmAffinity: {ratings.filmAffinity}</span>}
              </div>
            </div>
          )}

          {/* Box Office */}
          {(boxOffice.budget ||
            boxOffice.openingWeekendUSA ||
            boxOffice.grossUSA ||
            boxOffice.cumulativeWorldwideGross) && (
            <div>
              <div className="text-sm font-semibold mb-1">Box office</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {boxOffice.budget && <div><span className="font-medium">Budget: </span>{boxOffice.budget}</div>}
                {boxOffice.openingWeekendUSA && <div><span className="font-medium">Opening weekend USA: </span>{boxOffice.openingWeekendUSA}</div>}
                {boxOffice.grossUSA && <div><span className="font-medium">Gross USA: </span>{boxOffice.grossUSA}</div>}
                {boxOffice.cumulativeWorldwideGross && <div><span className="font-medium">Worldwide: </span>{boxOffice.cumulativeWorldwideGross}</div>}
              </div>
            </div>
          )}

          {/* Plot (CUỐI CÙNG) */}
          {plot && (
            <div className="pt-2">
              <div className="text-sm font-semibold mb-1">Plot</div>
              <p className="text-sm leading-relaxed">{plot}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}