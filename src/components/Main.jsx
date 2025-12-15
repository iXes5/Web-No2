import { useEffect, useState } from "react";
import PosterCarousel from "@/components/PosterCarousel";
import MoviesCarousel from "@/components/MoviesCarousel";
import { fetchMovies } from "@/lib/moviesApi";

const APP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzXzMxIiwicm9sZSI6InVzZXIiLCJhcGlfYWNjZXNzIjp0cnVlLCJpYXQiOjE3NjUzNjE3NjgsImV4cCI6MTc3MDU0NTc2OH0.O4I48nov3NLaKDSBhrPe9rKZtNs9q2Tkv4yK0uMthoo";

function mergeById(...pages) {
  const map = new Map();
  for (const arr of pages) {
    for (const m of arr || []) map.set(m.id, m);
  }
  return Array.from(map.values());
}

export default function Main() {
  const [heroMostPopular, setHeroMostPopular] = useState([]);
  const [mostPopular, setMostPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [
          hero,
          popularP1,
          popularP2,
          popularP3,
          ratedP1,
          ratedP2,
          ratedP3,
        ] = await Promise.all([
          // hero
          fetchMovies(`/movies/most-popular?page=1&limit=5`, {
            signal: controller.signal,
            token: APP_TOKEN,
          }),

          // Most popular: page 1..3, limit 10 (=> 30)
          fetchMovies(`/movies/most-popular?page=1&limit=10`, {
            signal: controller.signal,
            token: APP_TOKEN,
          }),
          fetchMovies(`/movies/most-popular?page=2&limit=10`, {
            signal: controller.signal,
            token: APP_TOKEN,
          }),
          fetchMovies(`/movies/most-popular?page=3&limit=10`, {
            signal: controller.signal,
            token: APP_TOKEN,
          }),

          // Top rated: page 1..3, limit 10 (=> 30)
          fetchMovies(`/movies/top-rated?page=1&limit=10`, {
            signal: controller.signal,
            token: APP_TOKEN,
          }),
          fetchMovies(`/movies/top-rated?page=2&limit=10`, {
            signal: controller.signal,
            token: APP_TOKEN,
          }),
          fetchMovies(`/movies/top-rated?page=3&limit=10`, {
            signal: controller.signal,
            token: APP_TOKEN,
          }),
        ]);

        setHeroMostPopular(hero);

        // gộp 3 trang lại (và chống trùng theo id)
        const popular30 = mergeById(popularP1, popularP2, popularP3).slice(0, 30);
        const rated30 = mergeById(ratedP1, ratedP2, ratedP3).slice(0, 30);

        setMostPopular(popular30);
        setTopRated(rated30);
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
      <PosterCarousel movies={heroMostPopular} />
      <MoviesCarousel title="Most Popular" movies={mostPopular} />
      <MoviesCarousel title="Top Rating" movies={topRated} />
    </main>
  );
}