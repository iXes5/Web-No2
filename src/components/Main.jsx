import { useEffect, useState } from "react";
import PosterCarousel from "@/components/PosterCarousel";
import MoviesCarousel from "@/components/MoviesCarousel";
import { fetchMovies, fetchManyPages, uniqById } from "@/lib/moviesApi";

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

        const [hero, popularAll, ratedAll] = await Promise.all([
          fetchMovies(`/movies/most-popular?page=1&limit=5`, {
            signal: controller.signal,
          }),
          fetchManyPages("/movies/most-popular", {
            pages: 3,
            limit: 10,
            signal: controller.signal,
          }),
          fetchManyPages("/movies/top-rated", {
            pages: 3,
            limit: 10,
            signal: controller.signal,
          }),
        ]);

        setHeroMostPopular(hero);
        setMostPopular(uniqById(popularAll).slice(0, 30));
        setTopRated(uniqById(ratedAll).slice(0, 30));
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