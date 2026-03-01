"use client";

import {
  Panel,
  Group,
  Separator,
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
}

export function SplitPanel({
  left,
  right,
  defaultLeftSize = 60,
  minLeftSize = 30,
  minRightSize = 20,
  orientation = "horizontal",
  className,
}: SplitPanelProps) {
  return (
    <Group orientation={orientation} className={cn("h-full", className)}>
      <Panel defaultSize={defaultLeftSize} minSize={minLeftSize}>
        {left}
      </Panel>
      <Separator className="w-1 bg-border hover:bg-primary/20 transition-colors" />
      <Panel minSize={minRightSize}>{right}</Panel>
    </Group>
  );
}
