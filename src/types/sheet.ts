export interface Cell {
  id: string;
  value: string;
  formula: string;
  format: CellFormat;
  computed?: number | string | null;
}

export interface CellFormat {
  bold: boolean;
  italic: boolean;
  fontSize: number;
  color: string;
}

export interface SheetRow {
  id: string;
  cells: { [key: string]: Cell };
  height: number;
}

export interface SheetColumn {
  id: string;
  width: number;
}

export interface SheetState {
  rows: SheetRow[];
  columns: SheetColumn[];
  selectedCell: string | null;
  selectedRange: string[] | null;
  copiedCells: { [key: string]: Cell } | null;
}