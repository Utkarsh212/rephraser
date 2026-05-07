import { Loader2 } from "lucide-react";

type Props = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "Loading…",
  className = "",
}: Props) {
  return (
    <div
      className={`flex items-center justify-center gap-2 py-12 text-stone-500 ${className}`}
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
