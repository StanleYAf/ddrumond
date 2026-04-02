import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="glass-card p-10 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
