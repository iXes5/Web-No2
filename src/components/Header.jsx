import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <header className="max-w-[1200px] mx-auto mt-4 bg-[var(--header-bg)] rounded-xl px-4 py-4 text-[var(--on-header)]">
      <div className="flex justify-between items-center relative">
        <div className="text-sm font-medium opacity-80">23120346</div>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-semibold">
          Movies info
        </h1>

        <div className="flex items-center gap-2">
          <Switch checked={isDark} onCheckedChange={setIsDark} />
          {isDark ? (
            <Moon className="w-5 h-5 opacity-90" />
          ) : (
            <Sun className="w-5 h-5 opacity-90" />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;