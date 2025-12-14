import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <header className="max-w-[1200px] mx-auto mt-4 bg-[#e8d5d5] rounded-xl px-4 py-4">
      <div className="flex justify-between items-center relative">
        <div className="text-gray-600 text-sm font-medium">23120346</div>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-semibold text-gray-800">
          Movies info
        </h1>

        <div className="flex items-center gap-2">
          <Switch checked={isDark} onCheckedChange={setIsDark} />
          {isDark ? (
            <Moon className="w-5 h-5 text-gray-700" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700" />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;