export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getCellCoordinates(cellId: string): [number, number] {
  const [col, row] = cellId.match(/([A-Z]+)(\d+)/)?.slice(1) || [];
  return [
    col.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1,
    parseInt(row) - 1
  ];
}

export function getCellId(colIndex: number, rowIndex: number): string {
  let colId = '';
  let n = colIndex + 1;
  
  while (n > 0) {
    const remainder = (n - 1) % 26;
    colId = String.fromCharCode(65 + remainder) + colId;
    n = Math.floor((n - 1) / 26);
  }
  
  return `${colId}${rowIndex + 1}`;
}