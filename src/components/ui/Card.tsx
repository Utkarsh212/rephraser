import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function Card({ children }: Props) {
  return (
    <section className="bg-white/55 backdrop-blur-sm border border-stone-200/70 rounded-2xl p-5">
      {children}
    </section>
  );
}
