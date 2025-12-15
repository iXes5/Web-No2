import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "@/lib/moviesApi";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function MoviesCarousel({ title, movies = [] }) {
  const pages = useMemo(() => chunk(movies, 3), [movies]);
  const [hoveredId, setHoveredId] = useState(null);

  if (!pages.length) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 text-lg font-semibold">{title}</div>

      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="py-10 -my-10 -ml-1">
          {pages.map((page, idx) => (
            <CarouselItem key={idx} className="pl-1">
              <div className="grid grid-cols-3 gap-1 py-2">
                {page.map((m) => {
                  const isHover = hoveredId === m.id;

                  return (
                    <div
                      key={m.id}
                      className="relative overflow-visible"
                      onMouseEnter={() => setHoveredId(m.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <Link
                        to={`/movies/${m.id}`}
                        className={[
                          "mx-auto block w-full max-w-[300px]",
                          "relative overflow-hidden rounded-md border bg-card",
                          "origin-center transition-transform duration-200 ease-out",
                          "cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          isHover ? "z-50 scale-135 shadow-2xl" : "z-0 scale-100",
                        ].join(" ")}
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

                        {isHover && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-white">
                            <div className="text-sm font-semibold leading-snug">
                              {m.title}
                            </div>
                            {m.year ? (
                              <div className="text-xs opacity-90">{m.year}</div>
                            ) : null}
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
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