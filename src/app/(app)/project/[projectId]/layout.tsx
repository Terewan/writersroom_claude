import type { ReactNode } from "react";

export default function ProjectLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  return <>{children}</>;
}
