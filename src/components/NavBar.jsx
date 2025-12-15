import { Home, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  function goHome() {
    setKeyword("");
    navigate("/");
  }

  function onSubmit(e) {
    e.preventDefault();
    const title = keyword.trim();
    if (!title) return;

    // Tìm kiếm 9 phim/trang → page=1&limit=9 (nếu SearchResults đang dùng 9/phần UI)
    navigate(`/search?title=${encodeURIComponent(title)}&page=1&limit=9`);
  }

  // Điều hướng tới Login/Register; việc gọi API sẽ do page Login/Register thực hiện
  function goLogin() {
    navigate("/login");
  }
  function goRegister() {
    navigate("/register");
  }

  return (
    <nav className="mx-auto mt-3 max-w-[1200px] rounded-xl bg-[var(--nav-bg)] px-4 py-2 text-[var(--on-nav)]">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Home + Auth box */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Home"
            onClick={goHome}
          >
            <Home className="h-5 w-5" />
          </button>

          {/* Auth box: Login / Register */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-transparent px-2 py-1">
            <Button
              type="button"
              size="sm"
              className="h-8 bg-white text-foreground hover:bg-white/90"
              variant="outline"
              onClick={goLogin}
            >
              Login
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 bg-white text-foreground hover:bg-white/90"
              variant="outline"
              onClick={goRegister}
            >
              Register
            </Button>
          </div>
        </div>

        {/* Right: Search */}
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
            <Input
              placeholder="Search..."
              className="h-9 w-[320px] pl-9 bg-secondary text-secondary-foreground border-border"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="h-9 bg.white text-foreground hover:bg-white/90"
            variant="outline"
          >
            Search
          </Button>
        </form>
      </div>
    </nav>
  );
}