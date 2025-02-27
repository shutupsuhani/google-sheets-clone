import { create } from 'zustand';
import { produce } from 'immer';
import { Cell, SheetState } from '../types/sheet';
import { generateId } from '../utils/helpers';
import { evaluateFormula } from '../utils/formulas';

const INITIAL_ROWS = 100;
const INITIAL_COLS = 26;

const createInitialState = (): SheetState => {
  const rows = Array.from({ length: INITIAL_ROWS }, (_, i) => ({
    id: `row-${i}`,
    height: 24,
    cells: Object.fromEntries(
      Array.from({ length: INITIAL_COLS }, (_, j) => [
        `${String.fromCharCode(65 + j)}${i + 1}`,
        {
          id: generateId(),
          value: '',
          formula: '',
          computed: null,
          format: {
            bold: false,
            italic: false,
            fontSize: 14,
            color: '#000000'
          }
        }
      ])
    )
  }));

  const columns = Array.from({ length: INITIAL_COLS }, (_, i) => ({
    id: `col-${i}`,
    width: 100
  }));

  return {
    rows,
    columns,
    selectedCell: null,
    selectedRange: null,
    copiedCells: null
  };
};

export const useSheetStore = create<{
  state: SheetState;
  setCellValue: (cellId: string, value: string) => void;
  setSelectedCell: (cellId: string | null) => void;
  setSelectedRange: (range: string[] | null) => void;
  updateCellFormat: (cellId: string, format: Partial<Cell['format']>) => void;
}>((set) => ({
  state: createInitialState(),

  setCellValue: (cellId: string, value: string) =>
    set(
      produce((state) => {
        const [col, row] = cellId.match(/([A-Z]+)(\d+)/)?.slice(1) || [];
        const rowIndex = parseInt(row) - 1;
        
        if (state.state.rows[rowIndex]) {
          const cell = state.state.rows[rowIndex].cells[cellId];
          if (cell) {
            cell.value = value;
            cell.formula = value.startsWith('=') ? value.substring(1) : '';
            
            // Evaluate formula if present
            if (value.startsWith('=')) {
              cell.computed = evaluateFormula(value.substring(1), state.state.rows);
            } else {
              cell.computed = null;
            }

            // Re-evaluate all cells that might depend on this one
            state.state.rows.forEach(row => {
              Object.entries(row.cells).forEach(([id, cell]) => {
                if (cell.formula && cell.formula.includes(cellId)) {
                  cell.computed = evaluateFormula(cell.formula, state.state.rows);
                }
              });
            });
          }
        }
      })
    ),

  setSelectedCell: (cellId: string | null) =>
    set(
      produce((state) => {
        state.state.selectedCell = cellId;
        state.state.selectedRange = cellId ? [cellId] : null;
      })
    ),

  setSelectedRange: (range: string[] | null) =>
    set(
      produce((state) => {
        state.state.selectedRange = range;
      })
    ),

  updateCellFormat: (cellId: string, format: Partial<Cell['format']>) =>
    set(
      produce((state) => {
        const [col, row] = cellId.match(/([A-Z]+)(\d+)/)?.slice(1) || [];
        const rowIndex = parseInt(row) - 1;
        
        if (state.state.rows[rowIndex]) {
          const cell = state.state.rows[rowIndex].cells[cellId];
          if (cell) {
            cell.format = { ...cell.format, ...format };
          }
        }
      })
    )
}));