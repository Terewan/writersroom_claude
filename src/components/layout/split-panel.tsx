"use client";

import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface SplitPanelProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftSize?: number;
  minLeftSize?: number;
  minRightSize?: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
  /** When set, panel sizes are persisted to localStorage under this key */
  autoSaveId?: string;
}

export function SplitPanel({
  left,
  right,
  defaultLeftSize = 60,
  minLeftSize = 30,
  minRightSize = 20,
  orientation = "horizontal",
  className,
  autoSaveId,
}: SplitPanelProps) {
  const persistence = useDefaultLayout({
    id: autoSaveId ?? "split-panel",
  });

  return (
    <Group
      orientation={orientation}
      defaultLayout={persistence.defaultLayout ?? { left: defaultLeftSize, right: 100 - defaultLeftSize }}
      onLayoutChanged={persistence.onLayoutChanged}
      className={cn("h-full", className)}
    >
      <Panel id="left" minSize={minLeftSize}>
        {left}
      </Panel>
      <Separator className="w-1 bg-border hover:bg-primary/20 transition-colors" />
      <Panel id="right" minSize={minRightSize}>
        {right}
      </Panel>
    </Group>
  );
}
