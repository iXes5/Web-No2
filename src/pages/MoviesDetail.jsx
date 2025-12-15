import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchMovieById, getImageUrl } from "@/lib/moviesApi";

// Helpers rất đơn giản
function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function namesFrom(input) {
  const arr = toArray(input);
  return arr
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return item;            // "Anthony Russo"
      if (typeof item?.name === "string") return item.name; // { id, name, ... }
      return null;
    })
    .filter(Boolean);
}
function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, "").trim();
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

  // Lấy dữ liệu hiển thị (cố gắng tận dụng tối đa object bạn cung cấp)
  const title = movie.title || "Untitled";
  const fullTitle = movie.full_title || "";      // Avengers: Endgame (2019)
  const year = movie.year || "";
  const poster = movie.image ? getImageUrl(movie.image) : "";
  const runtime = movie.runtime || "";           // 181 mins
  const awards = movie.awards || "";             // text dài tổng hợp giải thưởng

  const countries = Array.isArray(movie.countries) ? movie.countries : [];
  const languages = Array.isArray(movie.languages) ? movie.languages : [];
  const genres = Array.isArray(movie.genres) ? movie.genres : [];

  const directors = namesFrom(movie.directors ?? movie.director);
  const cast = namesFrom(movie.cast ?? movie.actors);

  const ratings = movie.ratings || {};           // { imDb, metacritic, theMovieDb, filmAffinity, rottenTomatoes }
  const boxOffice = movie.box_office || {};      // { budget, grossUSA, openingWeekendUSA, cumulativeWorldwideGross }

  // Plot đặt CUỐI CÙNG để không che thông tin khác
  const plot =
    movie.summary ||
    movie.short_description ||
    stripHtml(movie.plot_full || "");

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
        {/* Poster bên trái (to) */}
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
          {/* Tiêu đề + năm */}
          <h1 className="text-2xl font-semibold">
            {title} {year ? <span className="text-muted-foreground text-xl">({year})</span> : null}
          </h1>

          {/* Thông tin ngắn hữu ích (in LÊN TRƯỚC) */}
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

          {/* Genres (badges) */}
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

          {/* Director & Cast (Cast dưới Director) */}
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold">Director</div>
              <div className="mt-1 text-sm">
                {directors.length ? directors.join(", ") : <span className="text-muted-foreground">N/A</span>}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Cast</div>
              <div className="mt-1 text-sm">
                {cast.length ? cast.join(", ") : <span className="text-muted-foreground">N/A</span>}
              </div>
            </div>
          </div>

          {/* Ratings (nếu có) */}
          {(ratings.imDb ||
            ratings.metacritic ||
            ratings.theMovieDb ||
            ratings.filmAffinity ||
            ratings.rottenTomatoes) && (
            <div>
              <div className="text-sm font-semibold mb-1">Ratings</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {ratings.imDb && (
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 bg-card">
                    IMDb: {ratings.imDb}
                  </span>
                )}
                {ratings.metacritic && (
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 bg-card">
                    Metacritic: {ratings.metacritic}
                  </span>
                )}
                {ratings.theMovieDb && (
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 bg-card">
                    TMDb: {ratings.theMovieDb}
                  </span>
                )}
                {ratings.rottenTomatoes && (
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 bg-card">
                    Rotten Tomatoes: {ratings.rottenTomatoes}%
                  </span>
                )}
                {ratings.filmAffinity && (
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 bg-card">
                    FilmAffinity: {ratings.filmAffinity}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Box Office (nếu có) */}
          {(boxOffice.budget ||
            boxOffice.openingWeekendUSA ||
            boxOffice.grossUSA ||
            boxOffice.cumulativeWorldwideGross) && (
            <div>
              <div className="text-sm font-semibold mb-1">Box office</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {boxOffice.budget && (
                  <div>
                    <span className="font-medium">Budget: </span>
                    <span>{boxOffice.budget}</span>
                  </div>
                )}
                {boxOffice.openingWeekendUSA && (
                  <div>
                    <span className="font-medium">Opening weekend USA: </span>
                    <span>{boxOffice.openingWeekendUSA}</span>
                  </div>
                )}
                {boxOffice.grossUSA && (
                  <div>
                    <span className="font-medium">Gross USA: </span>
                    <span>{boxOffice.grossUSA}</span>
                  </div>
                )}
                {boxOffice.cumulativeWorldwideGross && (
                  <div>
                    <span className="font-medium">Worldwide: </span>
                    <span>{boxOffice.cumulativeWorldwideGross}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plot ở CUỐI CÙNG */}
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