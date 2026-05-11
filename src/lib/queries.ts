import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

const SETTINGS_KEY = ["settings"] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: api.getSettings,
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useRephrase() {
  return useMutation({ mutationFn: api.rephrase });
}

export function useModels(apiKey: string) {
  return useQuery({
    queryKey: ["models", apiKey],
    queryFn: () => api.listModels(apiKey),
    enabled: apiKey.trim().length > 20,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useCopy() {
  return useMutation({ mutationFn: api.copyToClipboard });
}

export function useReplace() {
  return useMutation({ mutationFn: api.replaceSelection });
}
