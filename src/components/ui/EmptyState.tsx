import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  message: string;
  hint?: string;
};

export function EmptyState({ icon, message, hint }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {icon && <div className="text-stone-400 mb-2">{icon}</div>}
      <p className="text-sm text-stone-600">{message}</p>
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}
