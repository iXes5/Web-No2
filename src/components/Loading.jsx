import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Spinner from "@/components/ui/spinner";

export default function Loading() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const firstLoad = useRef(true);
  const timer = useRef(null);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    setVisible(true);

    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 700);

    return () => clearTimeout(timer.current);
  }, [location.pathname, location.search]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/40 backdrop-blur-[1px]">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-center px-4">
        <Spinner size={36} />
      </div>
    </div>
  );
}