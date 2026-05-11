import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function SectionHeader({ children }: Props) {
  return (
    <h2 className="text-[11px] font-semibold text-stone-500 uppercase tracking-[0.1em] mb-3">
      {children}
    </h2>
  );
}
