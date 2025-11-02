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
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative text-sm font-bold select-none py-2 px-4 cursor-pointer"
          style={{ backgroundColor: 'transparent', color: '#FFFFFF' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          onClick={onViewAll}
        >
          {viewAllText}
        </button>
      )}
    </div>
  );
}

