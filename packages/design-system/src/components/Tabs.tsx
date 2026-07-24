import { cn } from '../lib/cn';

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn('flex gap-1 border-b border-border-1', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              'relative px-3 py-2.5 text-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary',
              active
                ? "text-tenant-primary-deep after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-tenant-primary after:content-['']"
                : 'text-text-2 hover:text-text-1',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
