import { SheetRow } from '../types/sheet';

type FormulaFunction = (args: (number | null)[]) => number | null;

const formulaFunctions: Record<string, FormulaFunction> = {
  SUM: (args) => {
    const validNumbers = args.filter((n): n is number => n !== null);
    return validNumbers.length ? validNumbers.reduce((a, b) => a + b, 0) : null;
  },
  AVERAGE: (args) => {
    const validNumbers = args.filter((n): n is number => n !== null);
    return validNumbers.length ? validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length : null;
  },
  MAX: (args) => {
    const validNumbers = args.filter((n): n is number => n !== null);
    return validNumbers.length ? Math.max(...validNumbers) : null;
  },
  MIN: (args) => {
    const validNumbers = args.filter((n): n is number => n !== null);
    return validNumbers.length ? Math.min(...validNumbers) : null;
  },
  COUNT: (args) => args.filter((n) => n !== null).length
};

const dataQualityFunctions: Record<string, (value: string) => string> = {
  TRIM: (value) => value.trim(),
  UPPER: (value) => value.toUpperCase(),
  LOWER: (value) => value.toLowerCase()
};

function expandCellRange(range: string): string[] {
  // Handle single cell
  if (range.indexOf(':') === -1) {
    return [range.trim()];
  }

  // Handle range (e.g., A1:B3)
  const [start, end] = range.split(':').map(r => r.trim());
  const startMatch = start.match(/([A-Z]+)(\d+)/);
  const endMatch = end.match(/([A-Z]+)(\d+)/);

  if (!startMatch || !endMatch) return [];

  const startCol = startMatch[1];
  const startRow = parseInt(startMatch[2]);
  const endCol = endMatch[1];
  const endRow = parseInt(endMatch[2]);

  const startColNum = colLetterToNumber(startCol);
  const endColNum = colLetterToNumber(endCol);

  const cells: string[] = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startColNum; col <= endColNum; col++) {
      cells.push(`${numberToColLetter(col)}${row}`);
    }
  }

  return cells;
}

function colLetterToNumber(col: string): number {
  return col.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0);
}

function numberToColLetter(num: number): string {
  let colName = '';
  while (num > 0) {
    const modulo = (num - 1) % 26;
    colName = String.fromCharCode(65 + modulo) + colName;
    num = Math.floor((num - 1) / 26);
  }
  return colName;
}

function getCellValue(cellRef: string, rows: SheetRow[]): number | null {
  const match = cellRef.match(/([A-Z]+)(\d+)/);
  if (!match) return null;

  const rowIndex = parseInt(match[2]) - 1;
  const cell = rows[rowIndex]?.cells[cellRef];

  if (!cell) return null;

  // If the cell contains a formula, return its computed value
  if (cell.computed !== null) {
    return typeof cell.computed === 'number' ? cell.computed : null;
  }

  // Try to parse the cell value as a number
  const value = parseFloat(cell.value);
  return isNaN(value) ? null : value;
}

function evaluateExpression(expression: string, rows: SheetRow[]): number | null {
  try {
    // Replace cell references with their values
    const evaluatedExpression = expression.replace(/[A-Z]+\d+/g, (match) => {
      const value = getCellValue(match, rows);
      return value !== null ? value.toString() : '0';
    });

    // Evaluate the expression
    // eslint-disable-next-line no-eval
    const result = eval(evaluatedExpression);
    return typeof result === 'number' ? result : null;
  } catch (error) {
    console.error('Expression evaluation error:', error);
    return null;
  }
}

export function evaluateFormula(formula: string, rows: SheetRow[]): number | string | null {
  try {
    // Extract function name and arguments
    const functionMatch = formula.match(/^(\w+)\((.*)\)$/);
    if (!functionMatch) {
      // If no function match, try to evaluate as a direct expression
      if (formula.match(/^[A-Z0-9+\-*/() ]+$/)) {
        return evaluateExpression(formula, rows);
      }
      return null;
    }

    const [_, functionName, args] = functionMatch;

    // Handle data quality functions
    if (functionName in dataQualityFunctions) {
      // For data quality functions, get the direct cell value without parsing as number
      const cellRef = args.trim();
      const match = cellRef.match(/([A-Z]+)(\d+)/);
      if (!match) return null;

      const rowIndex = parseInt(match[2]) - 1;
      const cell = rows[rowIndex]?.cells[cellRef];
      if (!cell) return null;

      return dataQualityFunctions[functionName](cell.value);
    }

    // Handle mathematical functions
    if (functionName in formulaFunctions) {
      // Check if the argument contains operators
      if (args.match(/[+\-*/]/)) {
        // If it contains operators, evaluate as expression
        const result = evaluateExpression(args, rows);
        return result !== null ? formulaFunctions[functionName]([result]) : null;
      }

      // Split arguments by comma, but handle ranges
      const ranges = args.split(',').map(range => range.trim());
      
      // Expand each range into individual cell references
      const cellRefs = ranges.flatMap(range => expandCellRange(range));
      
      // Get values for all cell references
      const values = cellRefs.map(ref => getCellValue(ref, rows));

      return formulaFunctions[functionName](values);
    }

    return null;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return null;
  }
}