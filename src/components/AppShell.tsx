import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-linear-to-br from-stone-50 via-orange-50/30 to-amber-50/40">
      <div className="max-w-2xl mx-auto px-5 pt-5 pb-8">{children}</div>
    </div>
  );
}
