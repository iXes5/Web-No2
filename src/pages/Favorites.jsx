import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/http";
import Spinner from "@/components/ui/spinner";
import { Link } from "react-router-dom";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const UI_PAGE_SIZE = 15;

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
  const mid = movie?.id;
  const title = movie?.title || "Untitled";
  const img = movie?.image_url || "";

  return (
    <div className="block overflow-hidden rounded-md border bg-card">
      <Link
        to={mid ? `/movies/${mid}` : "#"}
        className="block hover:scale-105 transition-transform"
        title={title}
      >
        {img ? (
          <img src={img} alt={title} className="aspect-[2/3] w-full object-cover" loading="lazy" />
        ) : (
          <div className="aspect-[2/3] w-full bg-muted" />
        )}
        <div className="px-3 py-2 text-center">
          <div className="text-sm font-medium line-clamp-2">{title}</div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        {mid ? (
          <Button variant="outline" className="w-full" onClick={() => onAskDelete(mid, title)}>
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
      setItems((prev) => prev.filter((m) => String(m?.id) !== String(pendingDelete.id)));
      setConfirmOpen(false);

      setUiPage((p) => {
        const newTotal = Math.max(1, Math.ceil((items.length - 1) / UI_PAGE_SIZE));
        return Math.min(p, newTotal);
      });
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {pageSlice.map((m) => (
              <MovieCard key={m.id || m.title} movie={m} onAskDelete={onAskDelete} />
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setUiPage((p) => Math.max(1, p - 1));
                    }}
                    className={uiPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {pageNumbers.map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (p !== uiPage) setUiPage(p);
                      }}
                      isActive={p === uiPage}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setUiPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className={uiPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

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