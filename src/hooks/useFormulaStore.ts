import { create } from 'zustand';
import { Operand } from '../utils/types';

interface FormulaState {
  formula: (string | number | Operand)[];
  setFormula: (formula: (string | number | Operand)[]) => void;
}

export const useFormulaStore = create<FormulaState>((set) => ({
  formula: [],
  setFormula: (formula) => set({ formula }),
}));