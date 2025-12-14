import { Home, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  return (
    <nav className="mx-auto mt-3 max-w-[1200px] rounded-xl bg-[#d7e2ff] px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-black/5"
          aria-label="Home"
        >
          <Home className="h-5 w-5 text-gray-800" />
        </button>

        <div className="flex items-center gap-2">
          {/* Input: đổi sang màu secondary */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-9 w-[320px] pl-9 bg-secondary text-secondary-foreground border-border"
            />
          </div>

          {/* Button: đổi sang màu trắng (outline) */}
          <Button type="button" className="h-9 bg-white text-foreground hover:bg-white/90" variant="outline">
            Search
          </Button>
        </div>
      </div>
    </nav>
  );
}