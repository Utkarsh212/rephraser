import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { KeyRound, Cpu, Save, X, Command } from "lucide-react";
import { useSettings, useSaveSettings, useModels } from "../lib/queries";
import { useUiStore } from "../store/uiStore";
import type { ModelOption, SaveSettingsInput } from "../types";
import { Button, Card, ErrorBanner, ShortcutInput } from "./ui";
import { inputClasses, labelClasses, selectClasses } from "../lib/styles";
import {
  API_KEY_DOCS_URL,
  DEFAULT_MODEL,
  DEFAULT_SHORTCUT,
  FALLBACK_MODELS,
  STRINGS,
} from "../lib/constants";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

type Props = {
  isFirstRun?: boolean;
};

const schema = Yup.object({
  apiKey: Yup.string().trim().required(STRINGS.errors.apiKeyRequired),
  model: Yup.string().required(STRINGS.errors.modelRequired),
  shortcut: Yup.string().required(STRINGS.errors.shortcutRequired),
});

export default function SettingsView({ isFirstRun = false }: Props) {
  const { data: settings } = useSettings();
  const save = useSaveSettings();
  const setView = useUiStore((s) => s.setView);

  const initial: SaveSettingsInput = {
    apiKey: settings?.apiKey || "",
    model: settings?.model || DEFAULT_MODEL,
    shortcut: settings?.shortcut || DEFAULT_SHORTCUT,
  };

  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-stone-900 mb-1">
          {isFirstRun
            ? STRINGS.settings.welcomeTitle
            : STRINGS.settings.title}
        </h2>
        <p className="text-sm text-stone-500">
          {isFirstRun
            ? STRINGS.settings.welcomeSubtitle
            : STRINGS.settings.subtitle}
        </p>
      </div>

      <Formik<SaveSettingsInput>
        initialValues={initial}
        enableReinitialize
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            await save.mutateAsync(values);
            setView("main");
          } catch (e) {
            setStatus(e instanceof Error ? e.message : String(e));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, status, values, setFieldValue }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="apiKey" className={labelClasses}>
                <KeyRound className="w-4 h-4" />
                {STRINGS.settings.apiKeyLabel}
              </label>
              <Field
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder={STRINGS.settings.apiKeyPlaceholder}
                autoComplete="off"
                className={inputClasses}
              />
              <ErrorMessage
                name="apiKey"
                component="div"
                className="text-red-600 text-xs mt-1"
              />
              <p className="text-xs text-stone-500 mt-1.5">
                {STRINGS.settings.apiKeyHelpPrefix}{" "}
                <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                  {API_KEY_DOCS_URL}
                </code>
                {STRINGS.settings.apiKeyHelpSuffix}
              </p>
            </div>

            <ModelSelect
              apiKey={values.apiKey}
              currentModel={values.model}
            />

            <div>
              <label className={labelClasses}>
                <Command className="w-4 h-4" />
                {STRINGS.settings.shortcutLabel}
              </label>
              <ShortcutInput
                value={values.shortcut}
                onChange={(accel) => setFieldValue("shortcut", accel)}
              />
              <ErrorMessage
                name="shortcut"
                component="div"
                className="text-red-600 text-xs mt-1"
              />
              <p className="text-xs text-stone-500 mt-1.5">
                {STRINGS.settings.shortcutHint}
              </p>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                type="submit"
                icon={<Save className="w-4 h-4" />}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? STRINGS.settings.saving
                  : STRINGS.settings.save}
              </Button>
              {!isFirstRun && (
                <Button
                  variant="secondary"
                  icon={<X className="w-4 h-4" />}
                  onClick={() => setView("main")}
                >
                  {STRINGS.settings.cancel}
                </Button>
              )}
            </div>

            {status && <ErrorBanner message={status} />}
          </Form>
        )}
      </Formik>
    </Card>
  );
}

function ModelSelect({
  apiKey,
  currentModel,
}: {
  apiKey: string;
  currentModel: string;
}) {
  const debouncedApiKey = useDebouncedValue(apiKey.trim(), 500);
  const models = useModels(debouncedApiKey);

  const fetched = models.data ?? [];
  const useFetched = fetched.length > 0;
  const baseOptions: readonly ModelOption[] = useFetched
    ? fetched
    : FALLBACK_MODELS;

  const hasCurrent = baseOptions.some((o) => o.value === currentModel);
  const options: ModelOption[] = hasCurrent
    ? [...baseOptions]
    : [{ value: currentModel, label: currentModel }, ...baseOptions];

  const showFallbackHint = models.isError && !useFetched;

  return (
    <div>
      <label htmlFor="model" className={labelClasses}>
        <Cpu className="w-4 h-4" />
        {STRINGS.settings.modelLabel}
      </label>
      <Field as="select" id="model" name="model" className={selectClasses}>
        {options.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </Field>
      {models.isFetching && (
        <p className="text-xs text-stone-500 mt-1.5">
          {STRINGS.settings.modelsLoading}
        </p>
      )}
      {showFallbackHint && (
        <p className="text-xs text-amber-600 mt-1.5">
          {STRINGS.settings.modelsFallbackHint}
        </p>
      )}
    </div>
  );
}
