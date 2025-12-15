import { Home, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";

export default function NavBar() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [debugToken, setDebugToken] = useState("");
  const auth = useAuth();

  function goHome() {
    setKeyword("");
    navigate("/");
  }

  function onSubmit(e) {
    e.preventDefault();
    const title = keyword.trim();
    if (!title) return;
    navigate(`/search?title=${encodeURIComponent(title)}&page=1&limit=9`);
  }

  function goLogin() { navigate("/login"); }
  function goRegister() { navigate("/register"); }
  function doLogout() { auth.logout(); navigate("/"); }

  function applyToken() {
    const t = debugToken.trim();
    if (!t) return;
    auth.setTokenManually(t);
    setDebugToken("");
  }

  return (
    <nav className="mx-auto mt-3 max-w-[1200px] rounded-xl bg-[var(--nav-bg)] px-4 py-2 text-[var(--on-nav)]">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Home + Auth/Profile box */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Home"
            onClick={goHome}
          >
            <Home className="h-5 w-5" />
          </button>

          {auth.isAuthenticated ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-2 py-1">
              <User className="h-4 w-4 opacity-80" />
              <span className="text-sm">{auth.user?.username || "User"}</span>
              <Button type="button" size="sm" variant="outline" className="h-8 bg-white text-foreground hover:bg-white/90" onClick={doLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-2 py-1">
              <Button type="button" size="sm" variant="outline" className="h-8 bg-white text-foreground hover:bg-white/90" onClick={goLogin}>
                Login
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-8 bg-white text-foreground hover:bg-white/90" onClick={goRegister}>
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Right: Search + Debug token */}
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

          <Button type="submit" className="h-9 bg-white text-foreground hover:bg-white/90" variant="outline">
            Search
          </Button>

          {/* Debug token box: dán JWT và áp dụng */}
          {!auth.isAuthenticated && (
            <div className="flex items-center gap-2 ml-3">
              <Input
                placeholder="Paste JWT token..."
                className="h-9 w-[280px] bg-secondary text-secondary-foreground border-border"
                value={debugToken}
                onChange={(e) => setDebugToken(e.target.value)}
              />
              <Button type="button" size="sm" variant="outline" className="h-9 bg-white hover:bg-white/90" onClick={applyToken}>
                Apply
              </Button>
            </div>
          )}
        </form>
      </div>
    </nav>
  );
}