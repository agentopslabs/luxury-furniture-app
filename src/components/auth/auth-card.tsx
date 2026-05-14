
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function AuthCard({ children, title, description, className }: AuthCardProps) {
  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className={cn("glass border-border/50 p-8", className)}>
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {children}
      </Card>
    </div>
  );
}
