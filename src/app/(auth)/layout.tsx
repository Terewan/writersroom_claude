import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grain-overlay relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Radial glow behind the card */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[500px] w-[500px] rounded-full bg-amber/5 blur-[120px]" />
      </div>

      {/* Decorative side quotes */}
      <div className="pointer-events-none absolute left-8 top-8 hidden select-none font-display text-[120px] leading-none text-amber/10 lg:block">
        &ldquo;
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 hidden select-none font-display text-[120px] leading-none text-amber/10 lg:block">
        &rdquo;
      </div>

      <div className="relative z-10 w-full max-w-md p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
