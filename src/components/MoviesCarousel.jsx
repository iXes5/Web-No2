import { useMemo } from "react";
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

export default function MoviesCarousel({ title, movies = [], imageUrl }) {
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
                        src={imageUrl(m.image)}
                        alt={m.title}
                        className="aspect-[2/3] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
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