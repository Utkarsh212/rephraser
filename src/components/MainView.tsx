import { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  ClipboardPaste,
  FileText,
} from "lucide-react";
import { useUiStore } from "../store/uiStore";
import { useRephrase, useCopy, useReplace } from "../lib/queries";
import { COPIED_FEEDBACK_MS, STRINGS } from "../lib/constants";
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  SectionHeader,
  Textarea,
} from "./ui";

export default function MainView() {
  const capturedText = useUiStore((s) => s.capturedText);
  const rephrasedText = useUiStore((s) => s.rephrasedText);
  const setCapturedText = useUiStore((s) => s.setCapturedText);
  const setRephrasedText = useUiStore((s) => s.setRephrasedText);

  const rephrase = useRephrase();
  const copy = useCopy();
  const replaceMut = useReplace();
  const [copied, setCopied] = useState(false);

  const trimmed = capturedText.trim();
  const errorMsg =
    (rephrase.error as Error | null)?.message ||
    (copy.error as Error | null)?.message ||
    (replaceMut.error as Error | null)?.message ||
    "";

  const handleRephrase = () => {
    if (!trimmed) return;
    rephrase.mutate(trimmed, { onSuccess: (data) => setRephrasedText(data) });
  };

  const handleCopy = () => {
    if (!rephrasedText) return;
    copy.mutate(rephrasedText, {
      onSuccess: () => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
      },
    });
  };

  const handleReplace = () => {
    if (!rephrasedText) return;
    replaceMut.mutate(rephrasedText);
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader>{STRINGS.capture.sectionLabel}</SectionHeader>
        <Textarea
          value={capturedText}
          onChange={(e) => setCapturedText(e.target.value)}
          placeholder={STRINGS.capture.placeholder}
          rows={4}
        />
        <div className="flex justify-end mt-3">
          <Button
            icon={<Sparkles className="w-4 h-4" />}
            onClick={handleRephrase}
            disabled={!trimmed}
            loading={rephrase.isPending}
          >
            {rephrase.isPending
              ? STRINGS.rephrase.pending
              : STRINGS.rephrase.button}
          </Button>
        </div>
      </Card>

      <Card>
        <SectionHeader>{STRINGS.rephrase.sectionLabel}</SectionHeader>
        {rephrase.isPending ? (
          <EmptyState
            icon={<Sparkles className="w-7 h-7 animate-pulse text-amber-500" />}
            message={STRINGS.rephrase.pendingMessage}
            hint={STRINGS.rephrase.pendingHint}
          />
        ) : rephrasedText ? (
          <div className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-lg text-sm leading-relaxed whitespace-pre-wrap text-stone-900">
            {rephrasedText}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="w-7 h-7" />}
            message={STRINGS.empty.message}
            hint={STRINGS.empty.hint}
          />
        )}
        {rephrasedText && !rephrase.isPending && (
          <div className="flex gap-2 mt-3 justify-end">
            <Button
              variant="secondary"
              icon={
                copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
              onClick={handleCopy}
              loading={copy.isPending}
            >
              {copied ? STRINGS.copy.success : STRINGS.copy.button}
            </Button>
            <Button
              variant="secondary"
              icon={<ClipboardPaste className="w-4 h-4" />}
              onClick={handleReplace}
              loading={replaceMut.isPending}
            >
              {replaceMut.isPending
                ? STRINGS.replace.pending
                : STRINGS.replace.button}
            </Button>
          </div>
        )}
      </Card>

      {errorMsg && <ErrorBanner message={errorMsg} />}
    </div>
  );
}
