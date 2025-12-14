import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/**
 * PosterCarousel (hero):
 * - mỗi slide 1 phim
 * - poster lớn ở giữa + overlay title/year/rate
 */
export default function PosterCarousel({ movies = [], imageUrl }) {
  if (!movies.length) return null;

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