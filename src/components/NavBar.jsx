import { Home, Search, User, LogOut, Heart, UserCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function NavBar() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
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

  function gotoProfile() { navigate("/profile"); }
  function gotoFavorites() { navigate("/users/favorites"); }

  function doLogout() {
    auth.logout();
    setLogoutOpen(false);
    navigate("/");
  }

  return (
    <>
      <nav className="mx-auto mt-3 max-w-[1200px] rounded-xl bg-[var(--nav-bg)] px-4 py-2 text-[var(--on-nav)]">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Home + Auth/Profile */}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                  >
                    <User className="h-4 w-4 opacity-80" />
                    <span className="max-w-[140px] truncate">{auth.user?.username || "User"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={gotoProfile} className="gap-2">
                    <UserCircle2 className="h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={gotoFavorites} className="gap-2">
                    <Heart className="h-4 w-4" /> Favorites
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLogoutOpen(true)} className="gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 rounded-md bg-transparent px-2 py-1">
                <Button type="button" size="sm" variant="outline" className="h-8 bg-white text-foreground hover:bg-white/90" onClick={goLogin}>
                  Login
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-8 bg-white text-foreground hover:bg-white/90" onClick={goRegister}>
                  Register
                </Button>
              </div>
            )}
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
            <Button type="submit" className="h-9 bg-white text-foreground hover:bg-white/90" variant="outline">
              Search
            </Button>
          </form>
        </div>
      </nav>

      {/* Logout dialog */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng xuất?</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại không?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}