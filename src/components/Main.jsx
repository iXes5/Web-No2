import { useEffect, useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const API_PREFIX = "/api";
const APP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzXzMxIiwicm9sZSI6InVzZXIiLCJhcGlfYWNjZXNzIjp0cnVlLCJpYXQiOjE3NjUzNjE3NjgsImV4cCI6MTc3MDU0NTc2OH0.O4I48nov3NLaKDSBhrPe9rKZtNs9q2Tkv4yK0uMthoo";

function normalizeImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_PREFIX}${image.startsWith("/") ? "" : "/"}${image}`;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchMovies(path, { signal } = {}) {
  const res = await fetch(`${API_PREFIX}${path}`, {
    method: "GET",
    headers: {
      "x-app-token": APP_TOKEN,
      Accept: "application/json",
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

// Carousel 1: 5 phim phổ biến nhất (poster to)
function HeroCarousel({ movies }) {
  if (!movies?.length) return null;

  return (
    <section className="mt-2">
      <Carousel opts={{ align: "center", loop: true }} className="w-full">
        <CarouselContent>
          {movies.map((m) => (
            <CarouselItem key={m.id} className="flex justify-center">
              <div className="w-[320px] sm:w-[380px] md:w-[430px]">
                <div className="relative overflow-hidden rounded-md border bg-card">
                  {m.image ? (
                    <img
                      src={normalizeImageUrl(m.image)}
                      alt={m.title}
                      className="aspect-[2/3] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-4 py-3 text-white">
                    <div className="text-base sm:text-lg font-semibold">
                      {m.title} {m.year ? `(${m.year})` : ""}
                    </div>
                    {typeof m.rate === "number" && (
                      <div className="mt-1 text-xs sm:text-sm opacity-90">
                        ⭐ {m.rate}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-2 sm:left-6" />
        <CarouselNext className="right-2 sm:right-6" />
      </Carousel>
    </section>
  );
}

// Carousel 2: 30 phim phổ biến (mỗi slide 5 phim / 1 hàng)
function MovieRowCarousel({ title, movies }) {
  const pages = useMemo(() => chunk(movies, 5), [movies]);
  if (!pages.length) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 text-lg font-semibold">{title}</div>

      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent>
          {pages.map((page, idx) => (
            <CarouselItem key={idx}>
              <div className="grid grid-cols-5 gap-3">
                {page.map((m) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-md border bg-card"
                    title={m.title}
                  >
                    {m.image ? (
                      <img
                        src={normalizeImageUrl(m.image)}
                        alt={m.title}
                        className="aspect-[2/3] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}

                    <div className="px-2 py-2">
                      <div className="line-clamp-1 text-xs font-medium">
                        {m.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground flex gap-2">
                        {m.year ? <span>{m.year}</span> : null}
                        {typeof m.rate === "number" ? <span>⭐ {m.rate}</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="-left-3" />
        <CarouselNext className="-right-3" />
      </Carousel>
    </section>
  );
}

export default function Main() {
  // BẢN 1 (để commit từ từ): chỉ 2 carousel đầu
  // (1) 5 phim most-popular (to)
  // (2) 30 phim most-popular (5 phim / slide)

  const [heroMostPopular, setHeroMostPopular] = useState([]);
  const [mostPopular30, setMostPopular30] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [hero, popular30] = await Promise.all([
          fetchMovies(`/movies/most-popular?page=1&limit=5`, {
            signal: controller.signal,
          }),
          fetchMovies(`/movies/most-popular?page=1&limit=30`, {
            signal: controller.signal,
          }),
        ]);

        setHeroMostPopular(hero);
        setMostPopular30(popular30);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4">
        <div className="py-16 text-center text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4">
        <div className="py-10 text-center text-destructive">{error}</div>
      </main>
    );
  }

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4">
      <HeroCarousel movies={heroMostPopular} />
      <MovieRowCarousel title="Most Popular" movies={mostPopular30} />
    </main>
  );
}