import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/http";
import Spinner from "@/components/ui/spinner";
import { Link } from "react-router-dom";
import { getImageUrl } from "@/lib/moviesApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Pagination helpers
const UI_PAGE_SIZE = 9;
function getPageRange(current, total, maxButtons = 9) {
  if (!total || total < 1) return [1];
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

function MovieCard({ movie, onAskDelete }) {
  const title = movie?.title || movie?.name || "Untitled";
  const year = movie?.year || movie?.release_year || "";
  const img = movie?.image ? getImageUrl(movie.image) : "";
  const mid = movie?.id ?? movie?.movieId ?? movie?.movie_id;

  return (
    <div className="block overflow-hidden rounded-md border bg-card">
      <Link to={mid ? `/movies/${mid}` : "#"} className="block hover:scale-105 transition-transform">
        {img ? (
          <img src={img} alt={title} className="aspect-[2/3] w-full object-cover" loading="lazy" />
        ) : (
          <div className="aspect-[2/3] w-full bg-muted" />
        )}
        <div className="px-3 py-2 text-center">
          <div className="text-sm font-medium">
            {title} {year ? `(${year})` : ""}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        {mid ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onAskDelete(mid, title)}
          >
            Xóa khỏi yêu thích
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function Favorites() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [uiPage, setUiPage] = useState(1);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / UI_PAGE_SIZE)), [items]);
  const pageNumbers = useMemo(() => getPageRange(uiPage, totalPages, 9), [uiPage, totalPages]);
  const startIdx = (uiPage - 1) * UI_PAGE_SIZE;
  const pageSlice = items.slice(startIdx, startIdx + UI_PAGE_SIZE);

  // Delete dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState({ id: null, title: "" });
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await apiFetch("/users/favorites", { method: "GET", signal: controller.signal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setItems(list);
        setUiPage(1);
      } catch (e) {
        if (e?.name !== "AbortError") setErr(e?.message || "Failed to load favorites");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  function onAskDelete(movieId, title) {
    setDeleteErr("");
    setPendingDelete({ id: movieId, title });
    setConfirmOpen(true);
  }

  async function onConfirmDelete() {
    if (!pendingDelete.id) return;
    try {
      setDeleting(true);
      setDeleteErr("");
      const res = await apiFetch(`/users/favorites/${encodeURIComponent(pendingDelete.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Delete failed (HTTP ${res.status})`);
      }
      // Remove locally
      setItems((prev) => prev.filter((m) => String(m?.id ?? m?.movieId ?? m?.movie_id) !== String(pendingDelete.id)));
      setConfirmOpen(false);
    } catch (e) {
      setDeleteErr(e?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="max-w-[1200px] mx-auto mt-6 px-4 pb-10">
      <h1 className="text-lg font-semibold mb-3">Your favorites</h1>
      {loading ? (
        <div className="py-12 flex justify-center"><Spinner size={28} /></div>
      ) : err ? (
        <div className="py-12 text-center text-destructive">{err}</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No favorites yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {pageSlice.map((m) => (
              <MovieCard key={m.id || m.title} movie={m} onAskDelete={onAskDelete} />
            ))}
          </div>

          {/* Pagination: tối đa 9 nút số trang */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-md border bg-card p-1">
              <Button
                variant="outline"
                onClick={() => setUiPage((p) => Math.max(1, p - 1))}
                disabled={uiPage <= 1}
              >
                Prev
              </Button>
              <div className="flex items-center gap-1 px-2">
                {pageNumbers.map((p) => (
                  <Button
                    key={p}
                    variant={p === uiPage ? "default" : "outline"}
                    onClick={() => setUiPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setUiPage((p) => Math.min(totalPages, p + 1))}
                disabled={uiPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa khỏi yêu thích?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa phim
              {pendingDelete.title ? ` “${pendingDelete.title}”` : ""} khỏi danh sách yêu thích?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
          {deleteErr ? <div className="mt-2 text-sm text-destructive">{deleteErr}</div> : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}