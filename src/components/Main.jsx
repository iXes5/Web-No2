import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const APP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzXzMxIiwicm9sZSI6InVzZXIiLCJhcGlfYWNjZXNzIjp0cnVlLCJpYXQiOjE3NjUzNjE3NjgsImV4cCI6MTc3MDU0NTc2OH0.O4I48nov3NLaKDSBhrPe9rKZtNs9q2Tkv4yK0uMthoo";

const API_BASE = "/api";

function normalizeImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE}${image.startsWith("/") ? "" : "/"}${image}`;
}

export default function Main() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/movies/most-popular?page=1&limit=10`,
          {
            headers: {
              "x-app-token": APP_TOKEN,
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }

        const json = await res.json();
        setMovies(Array.isArray(json?.data) ? json.data : []);
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
        <div className="py-16 text-center text-muted-foreground">
          Loading movies...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4">
        <div className="py-16 text-center text-destructive">{error}</div>
      </main>
    );
  }

  if (movies.length === 0) {
    return (
      <main className="max-w-[1200px] mx-auto mt-6 px-4">
        <div className="py-16 text-center text-muted-foreground">
          No movies found.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4">
      <Carousel opts={{ align: "center", loop: true }} className="w-full">
        <CarouselContent>
          {movies.map((m) => (
            <CarouselItem key={m.id} className="flex justify-center">
              <div className="w-[260px] sm:w-[320px]">
                <div className="relative overflow-hidden rounded-md border bg-card">
                  {m.image ? (
                    <img
                      src={normalizeImageUrl(m.image)}
                      alt={`${m.title} poster`}
                      className="aspect-[2/3] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2 text-white">
                    <div className="text-sm font-semibold leading-snug">
                      {m.title} {m.year ? `(${m.year})` : ""}
                    </div>
                    {typeof m.rate === "number" && (
                      <div className="text-xs opacity-90">Rate: {m.rate}</div>
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
    </main>
  );
}