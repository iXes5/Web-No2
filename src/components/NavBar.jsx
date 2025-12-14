import { Home, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  return (
    <nav className="max-w-[1200px] mx-auto mt-3 bg-[#d7e2ff] rounded-xl px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Home */}
        <button
          type="button"
          className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-black/5"
          aria-label="Home"
        >
          <Home className="h-5 w-5 text-gray-800" />
        </button>

        {/* Right: Search group */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-full border overflow-hidden h-9">
            <Search className="h-4 w-4 text-gray-500 ml-3" />
            <Input
              placeholder="Search..."
              className="h-9 w-[320px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
            />
          </div>

          <Button type="button" className="h-9 rounded-full" variant="secondary">
            Search
          </Button>
        </div>
      </div>
    </nav>
  );
}