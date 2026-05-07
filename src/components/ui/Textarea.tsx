import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...rest }: Props) {
  return (
    <textarea
      className={`w-full p-3 border border-stone-200 rounded-lg bg-white/80 text-sm leading-relaxed text-stone-900 resize-y focus:outline-none focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-300/40 transition-colors duration-150 placeholder:text-stone-400 ${className}`}
      {...rest}
    />
  );
}
