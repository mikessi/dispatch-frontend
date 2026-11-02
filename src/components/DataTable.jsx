import { useEffect, useRef, useState } from "react";

const MIN_COLUMN_WIDTH = 44;
// Height of the pinned column headings, in pixels (for scrolling a row to just below them)
export const TABLE_HEADER_HEIGHT = 40;

const alignClass = (column) =>
  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left';

// Column widths for one table, remembered in this browser under `storageKey`.
// Each column is { key, width } where width is its starting width in pixels.
export function useColumnWidths(storageKey, columns) {
  const fullKey = `columnWidths.${storageKey}`;
  const defaults = Object.fromEntries(columns.map((column) => [column.key, column.width]));
  const [widths, setWidths] = useState(() => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(fullKey) || '{}') };
    } catch {
      return defaults;
    }
  });
  const resizing = useRef(null);

  useEffect(() => {
    localStorage.setItem(fullKey, JSON.stringify(widths));
  }, [fullKey, widths]);

  // Dragging a column's right edge resizes it
  const startResize = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { key, startX: e.clientX, startWidth: widths[key] };
    const onMove = (event) => {
      const { key: column, startX, startWidth } = resizing.current;
      const width = Math.max(MIN_COLUMN_WIDTH, Math.round(startWidth + event.clientX - startX));
      setWidths((prev) => (prev[column] === width ? prev : { ...prev, [column]: width }));
    };
    const onUp = () => {
      resizing.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
  };

  return {
    widths,
    tableWidth: columns.reduce((total, column) => total + widths[column.key], 0),
    startResize,
    resetColumn: (key) => setWidths((prev) => ({ ...prev, [key]: defaults[key] })),
    resetAll: () => setWidths(defaults),
  };
}

// How a table using ColumnHeaders should size itself: at least as wide as its
// columns, and filling the box when there's room to spare
export const tableSizeStyle = (sizing) => ({ width: '100%', minWidth: sizing.tableWidth });

// <colgroup> + <thead> for a fixed-layout table: headings stay pinned while the
// table's scroll box scrolls, and each has a drag handle on its right edge.
// Adds one blank filler column on the right; body rows need a matching empty cell.
export function ColumnHeaders({ columns, sizing }) {
  return (
    <>
      <colgroup>
        {columns.map((column) => <col key={column.key} style={{ width: sizing.widths[column.key] }} />)}
        {/* Takes up whatever width is left over, so the real columns keep their exact sizes */}
        <col />
      </colgroup>
      <thead>
        <tr className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {columns.map((column) => (
            <th
              key={column.key}
              title={column.title}
              className={`sticky top-0 z-10 bg-white py-2.5 px-2 shadow-[inset_0_-1px_0_#d1d5db] ${alignClass(column)}`}
            >
              <span className="block truncate">{column.label}</span>
              {!column.fixed && (
                <span
                  onMouseDown={(e) => sizing.startResize(e, column.key)}
                  onDoubleClick={() => sizing.resetColumn(column.key)}
                  title="Drag to resize · double-click to reset"
                  className="absolute top-0 right-0 h-full w-2 cursor-col-resize border-r-2 border-gray-200 hover:border-purple-500"
                />
              )}
            </th>
          ))}
          <th className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_#d1d5db]" />
        </tr>
      </thead>
    </>
  );
}

// The scrolling box a pinned-heading table sits in
export function TableScrollBox({ maxHeight = 'calc(100vh - 230px)', children }) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-auto" style={{ maxHeight }}>
      {children}
    </div>
  );
}

// A list table with pinned headings and resizable columns.
// columns: [{ key, label, width, align?, title?, render: (row) => content }]
export default function DataTable({ storageKey, columns, rows, onRowClick, rowClassName, footer, maxHeight }) {
  const sizing = useColumnWidths(storageKey, columns);

  return (
    <TableScrollBox maxHeight={maxHeight}>
      <table className="table-fixed text-sm" style={tableSizeStyle(sizing)}>
        <ColumnHeaders columns={columns} sizing={sizing} />
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-t border-gray-100 align-top ${onRowClick ? 'cursor-pointer hover:bg-purple-50/50' : 'hover:bg-gray-50'} ${
                rowClassName ? rowClassName(row) : ''
              }`}
            >
              {columns.map((column) => {
                const content = column.render(row);
                return (
                  <td
                    key={column.key}
                    // Text cut short by a narrow column can still be read on hover
                    title={typeof content === 'string' ? content : undefined}
                    className={`py-2 px-2 truncate [&_p]:truncate ${alignClass(column)}`}
                  >
                    {content}
                  </td>
                );
              })}
              <td />
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </TableScrollBox>
  );
}
