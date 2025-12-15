import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { getImageUrl } from "@/lib/moviesApi";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function PosterCarousel({ movies = [] }) {
  if (!movies.length) return null;

  return (
    <section className="mt-2">
      <Carousel opts={{ align: "center", loop: true }} className="w-full">
        <CarouselContent>
          {movies.map((m) => (
            <CarouselItem key={m.id} className="flex justify-center">
              <div className="w-[320px] sm:w-[380px] md:w-[430px]">
                <Link
                  to={`/movies/${m.id}`}
                  className="block relative overflow-hidden rounded-md border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={`Open details for ${m.title}`}
                  title={m.title}
                >
                  {m.image ? (
                    <img
                      src={getImageUrl(m.image)}
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
                      <div className="mt-1 flex items-center gap-1 text-xs sm:text-sm opacity-90">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{m.rate}</span>
                      </div>
                    )}
                  </div>
                </Link>
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