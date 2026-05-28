import React from 'react';
import { getCategoryColor } from '../../utils/categoryColors';

const BoundingBox = ({ boxes, containerWidth, containerHeight }) => {
  if (!boxes || boxes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg width="100%" height="100%" viewBox={`0 0 ${containerWidth} ${containerHeight}`} preserveAspectRatio="none">
        {boxes.map((box, index) => {
          // Normalizing box coordinates if they are percentages (0-1)
          // COCO-SSD returns [x, y, width, height] in pixels relative to original image size
          // We need to pass scaled boxes or calculate here based on original vs container size
          // Assuming `boxes` are already scaled to `containerWidth` and `containerHeight`
          const [x, y, width, height] = box.bbox;
          const colorClass = getCategoryColor(box.category || 'default');
          // Since getCategoryColor returns tailwind classes like 'bg-red-100 text-red-800', 
          // we need a hex color for SVG stroke. Let's provide a utility for hex colors or fallback.
          // For simplicity, using currentColor or a solid color based on index.
          const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
          const color = colors[index % colors.length];

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="transparent"
                stroke={color}
                strokeWidth="3"
                rx="4"
              />
              <text
                x={x}
                y={y > 20 ? y - 5 : y + 15}
                fill="white"
                fontSize="14"
                fontWeight="bold"
                className="drop-shadow-md"
              >
                {box.class}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BoundingBox;
