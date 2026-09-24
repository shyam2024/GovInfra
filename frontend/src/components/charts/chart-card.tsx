import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/tables/empty-state';

interface ChartCardProps {
  title: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, isLoading, isEmpty, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? <Skeleton className="h-64 w-full" /> : isEmpty ? <EmptyState title="No data yet" /> : <div className="h-64 w-full">{children}</div>}
      </CardContent>
    </Card>
  );
}
