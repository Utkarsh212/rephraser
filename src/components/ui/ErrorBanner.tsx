import { AlertCircle } from "lucide-react";

type Props = {
  message: string;
  className?: string;
};

export function ErrorBanner({ message, className = "" }: Props) {
  return (
    <div
      className={`flex items-start gap-2 p-3 bg-red-50/70 border border-red-200/70 rounded-lg text-red-800 text-sm ${className}`}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="break-words">{message}</span>
    </div>
  );
}
