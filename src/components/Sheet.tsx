import React, { useCallback, useRef, useState } from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { Cell as CellType } from '../types/sheet';
import { getCellId } from '../utils/helpers';
import { Bold, Italic, Type, AlignLeft, AlignCenter, AlignRight, DollarSign, Percent, ChevronDown, Undo, Redo, PaintBucket, ListOrdered as BorderAll, Save, Printer, Copy, Scissors, FileSpreadsheet, StarIcon } from 'lucide-react';

export function Sheet() {
  const {
    state,
    setCellValue,
    setSelectedCell,
    setSelectedRange,
    updateCellFormat
  } = useSheetStore();
  
  const formulaBarRef = useRef<HTMLInputElement>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const handleCellClick = useCallback((cellId: string) => {
    setSelectedCell(cellId);
    setEditingCell(cellId);
    formulaBarRef.current?.focus();
  }, [setSelectedCell]);

  const handleCellChange = useCallback((cellId: string, value: string) => {
    setCellValue(cellId, value);
  }, [setCellValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, cellId: string) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    }
  }, []);

  const renderMenuBar = () => (
    <div className="flex items-center px-2 py-1 border-b bg-white">
      <div className="flex items-center gap-1 mr-4">
        <FileSpreadsheet className="w-5 h-5 text-green-700" />
        <input 
          className="text-sm px-2 focus:outline-none  py-1 w-48 hover:bg-gray-100 text-gray-500 rounded"
          defaultValue="Untitled spreadsheet"
        />

        <StarIcon className='text-gray-500'/>
      </div>
      <div className="flex gap-4">
        {['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Extensions', 'Help'].map(menu => (
          <button key={menu} className="text-sm px-2 py-1 hover:bg-gray-100 rounded">
            {menu}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="p-1.5 hover:bg-gray-100 rounded"><Undo className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><Redo className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><Printer className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><Copy className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><Scissors className="w-4 h-4" /></button>
      </div>
    </div>
  );

  const renderToolbar = () => (
    <div className="flex flex-col border-b bg-white">
      <div className="flex items-center gap-2 p-1 border-b">
        <select className="text-sm border rounded px-2 py-1 w-36">
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Courier New</option>
        </select>
        <select className="text-sm border rounded px-2 py-1 w-16">
          {[8, 9, 10, 11, 12, 14, 16, 18, 24, 36].map(size => (
            <option key={size}>{size}</option>
          ))}
        </select>
        <div className="h-4 border-r mx-1" />
        <button className="p-1.5 hover:bg-gray-100 rounded"><Bold className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><Italic className="w-4 h-4" /></button>
        <div className="h-4 border-r mx-1" />
        <button className="p-1.5 hover:bg-gray-100 rounded"><DollarSign className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><Percent className="w-4 h-4" /></button>
        <div className="h-4 border-r mx-1" />
        <button className="p-1.5 hover:bg-gray-100 rounded"><AlignLeft className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><AlignCenter className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><AlignRight className="w-4 h-4" /></button>
        <div className="h-4 border-r mx-1" />
        <button className="p-1.5 hover:bg-gray-100 rounded"><PaintBucket className="w-4 h-4" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><BorderAll className="w-4 h-4" /></button>
      </div>
      <div className="flex items-center p-1">
        <div className="flex items-center bg-gray-100 rounded px-2 py-1 mr-2">
          <div className="text-sm font-medium mr-2">fx</div>
          <input
            ref={formulaBarRef}
            className="bg-transparent outline-none w-96"
            value={state.selectedCell ? state.rows[parseInt(state.selectedCell.match(/\d+/)?.[0] || '1') - 1]
              ?.cells[state.selectedCell]?.value || '' : ''}
            onChange={(e) => state.selectedCell && handleCellChange(state.selectedCell, e.target.value)}
            placeholder="Enter value or formula"
          />
        </div>
      </div>
    </div>
  );

  const renderCell = useCallback((cell: CellType, cellId: string) => {
    const isSelected = state.selectedCell === cellId;
    const isEditing = editingCell === cellId;
    
    return (
      <div
        key={cell.id}
        className={`relative border-r border-b border-gray-200 ${
          isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''
        }`}
        style={{
          fontWeight: cell.format.bold ? 'bold' : 'normal',
          fontStyle: cell.format.italic ? 'italic' : 'normal',
          fontSize: `${cell.format.fontSize}px`,
          color: cell.format.color,
          padding: '3px 6px',
          minHeight: '24px',
          backgroundColor: isSelected ? '#e8f0fe' : 'white'
        }}
        onClick={() => handleCellClick(cellId)}
      >
        {isEditing ? (
          <input
            autoFocus
            className="absolute inset-0 w-full h-full bg-white px-1"
            value={cell.value}
            onChange={(e) => handleCellChange(cellId, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, cellId)}
            onBlur={() => setEditingCell(null)}
          />
        ) : (
          cell.computed !== null ? cell.computed : cell.value
        )}
      </div>
    );
  }, [state.selectedCell, editingCell, handleCellClick, handleCellChange, handleKeyDown]);

  const renderColumnHeaders = () => (
    <div className="flex sticky top-0 z-20 bg-gray-50">
      <div className="w-10 shrink-0 border-r border-b border-gray-300" />
      {state.columns.map((col, index) => (
        <div
          key={col.id}
          className="shrink-0 border-r border-b border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-700 font-medium"
          style={{ width: col.width }}
        >
          {String.fromCharCode(65 + index)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {renderMenuBar()}
      {renderToolbar()}
      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full">
          {renderColumnHeaders()}
          <div className="border-l border-gray-300">
            {state.rows.map((row, rowIndex) => (
              <div key={row.id} className="flex">
                <div className="w-10 shrink-0 border-r border-b border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-700">
                  {rowIndex + 1}
                </div>
                {state.columns.map((col, colIndex) => (
                  <div
                    key={col.id}
                    className="shrink-0"
                    style={{ width: col.width }}
                  >
                    {renderCell(row.cells[getCellId(colIndex, rowIndex)], getCellId(colIndex, rowIndex))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}