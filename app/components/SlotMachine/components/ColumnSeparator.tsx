interface ColumnSeparatorProps {
  showGuidelines: boolean;
  colIndex: number;
}

export default function ColumnSeparator({ showGuidelines, colIndex }: ColumnSeparatorProps) {
  if (!showGuidelines || colIndex === 0) return null;

  return (
    <div
      className="absolute left-0 top-0 bottom-0 z-20 flex-1 flex items-center justify-center"
      style={{
        width: "2px",
        transform: "translateX(-50%)",
        backgroundColor: "#34383C",
      }}
    />
  );
}

