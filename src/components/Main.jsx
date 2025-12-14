import { useEffect, useState } from "react";
import PosterCarousel from "@/components/PosterCarousel";
import MoviesCarousel from "@/components/MoviesCarousel";

const API_PREFIX = "/api";
const APP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzXzMxIiwicm9sZSI6InVzZXIiLCJhcGlfYWNjZXNzIjp0cnVlLCJpYXQiOjE3NjUzNjE3NjgsImV4cCI6MTc3MDU0NTc2OH0.O4I48nov3NLaKDSBhrPe9rKZtNs9q2Tkv4yK0uMthoo";

function imageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_PREFIX}${image.startsWith("/") ? "" : "/"}${image}`;
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

export default function Main() {
  // (1) 5 phim most popular (poster to)
  // (2) 30 phim most popular (5 phim / slide)
  // (3) 30 phim top rated (5 phim / slide)

  const [heroMostPopular, setHeroMostPopular] = useState([]);
  const [mostPopular30, setMostPopular30] = useState([]);
  const [topRated30, setTopRated30] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [hero, popular30, rated30] = await Promise.all([
          fetchMovies(`/movies/most-popular?page=1&limit=5`, {
            signal: controller.signal,
          }),
          fetchMovies(`/movies/most-popular?page=1&limit=30`, {
            signal: controller.signal,
          }),
          fetchMovies(`/movies/top-rated?page=1&limit=30`, {
            signal: controller.signal,
          }),
        ]);

        setHeroMostPopular(hero);
        setMostPopular30(popular30);
        setTopRated30(rated30);
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
      <PosterCarousel movies={heroMostPopular} imageUrl={imageUrl} />

      <MoviesCarousel
        title="Most Popular"
        movies={mostPopular30}
        imageUrl={imageUrl}
      />

      <MoviesCarousel
        title="Top Rating"
        movies={topRated30}
        imageUrl={imageUrl}
      />
    </main>
  );
}