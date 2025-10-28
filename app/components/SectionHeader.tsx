'use client';

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  onViewAll?: () => void;
  viewAllText?: string;
  className?: string;
}

export default function SectionHeader({ 
  title, 
  icon, 
  onViewAll, 
  viewAllText = "查看全部",
  className = "" 
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-row justify-between items-center gap-2 ${className}`}>
      <div className="flex flex-row items-center gap-2">
        <div className="text-gray-400 size-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      {onViewAll && (
        <div 
          className="hover:bg-gray-600 text-white rounded-md text-sm font-extrabold py-2 px-4 cursor-pointer select-none"
          onClick={onViewAll}
        >
          {viewAllText}
        </div>
      )}
    </div>
  );
}

