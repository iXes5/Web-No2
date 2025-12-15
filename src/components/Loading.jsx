import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// Overlay skeleton ngắn hiển thị khi chuyển route,
// giúp tránh cảm giác "trống" lúc trang mới chưa có dữ liệu.
export default function Loading() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const firstLoad = useRef(true);
  const hideTimer = useRef(null);

  useEffect(() => {
    // Bỏ qua lần mount đầu
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    // Hiện overlay ngay khi route đổi
    setVisible(true);

    // Ẩn sau một khoảng ngắn (không can thiệp vào logic fetch)
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 800);

    return () => {
      clearTimeout(hideTimer.current);
    };
  }, [location.pathname, location.search]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 bg-background/50 backdrop-blur-[1px]">
      <div className="mx-auto mt-16 w-full max-w-[1200px] px-4">
        {/* Card skeleton lớn mô phỏng khung nội dung route */}
        <div className="rounded-lg border bg-card p-4 md:p-6 animate-pulse">
          <div className="flex gap-6">
            <div className="hidden sm:block w-[260px] sm:w-[320px] md:w-[360px]">
              <div className="aspect-[2/3] w-full rounded-md bg-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-6 w-2/3 rounded bg-muted" />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-2/5 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-4 w-1/4 rounded bg-muted sm:col-span-2" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-20 rounded-full bg-muted" />
                <div className="h-5 w-12 rounded-full bg-muted" />
              </div>
              <div className="mt-5 space-y-2">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Card skeleton nhỏ mô phỏng box phụ (vd: reviews) */}
        <div className="mt-4 rounded-lg border bg-card p-4 md:p-6 animate-pulse">
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="mt-3 space-y-3">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}