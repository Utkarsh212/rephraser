import { create } from "zustand";
import type { View } from "../types";

type UiState = {
  view: View;
  capturedText: string;
  rephrasedText: string;
  setView: (view: View) => void;
  setCapturedText: (text: string) => void;
  setRephrasedText: (text: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  view: "main",
  capturedText: "",
  rephrasedText: "",
  setView: (view) => set({ view }),
  // Setting captured text clears any prior rephrase result.
  setCapturedText: (text) => set({ capturedText: text, rephrasedText: "" }),
  setRephrasedText: (text) => set({ rephrasedText: text }),
}));
