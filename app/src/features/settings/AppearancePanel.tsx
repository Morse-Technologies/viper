"use client";
import { useCallback, useState } from "react";
import { followSystem, pinTheme, useTheme, type Theme } from "@/features/shell/theme";
import { Segmented } from "@/ui/cells";

type Appearance = Theme | "system";
function readAppearance(): Appearance {
  if (typeof document === "undefined") return "system";
  const pinned = document.documentElement.dataset.theme;
  if (pinned === "light" || pinned === "dark") return pinned;
  return "system";
}

export function AppearancePanel() {
  const { theme, toggle } = useTheme();
  const [choice, setChoice] = useState<Appearance>(readAppearance);

  const onChange = useCallback((next: Appearance) => {
    setChoice(next);
    if (next === "system") {
      followSystem();
      return;
    }
    if (theme !== next) toggle();
    else pinTheme(next);
  }, [theme, toggle]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-body text-muted">Chrome stays ink either way. Pick a theme or follow the operating system.</p>
      <Segmented
        label="Appearance"
        value={choice}
        onChange={(v) => onChange(v)}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ]}
      />
    </div>
  );
}
