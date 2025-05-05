import { useState } from "react";

export default function ResizableTableHeader({ column, onResize }) {
  const [width, setWidth] = useState(column.width);

  const handleResize = (newWidth) => {
    setWidth(newWidth);
    onResize(column.id, newWidth);
  };

  return (
    <th
      className="px-3 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative group border-r border-gray-200 bg-gray-50"
      style={{
        width: width,
        minWidth: width,
        maxWidth: width,
        boxSizing: 'border-box',
        height: '48px'
      }}
    >
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
        {column.label}
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize border-r border-gray-300 hover:border-blue-500 hover:bg-blue-100 group-hover:border-blue-500 group-hover:bg-blue-100"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startWidth = width;
          
          const handleMouseMove = (e) => {
            const newWidth = startWidth + (e.clientX - startX);
            if (newWidth >= 50) {
              handleResize(newWidth);
            }
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
    </th>
  );
} 