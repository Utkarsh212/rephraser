import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
};

export function SectionHeader({ children, action, icon }: Props) {
  return (
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-[11px] font-semibold text-stone-500 uppercase tracking-[0.1em] flex items-center gap-1.5">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}
