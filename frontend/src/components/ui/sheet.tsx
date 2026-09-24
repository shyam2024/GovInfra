import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: 'left' | 'right';
}

export function SheetContent({ side = 'right', className, children, ...props }: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-[1000] bg-slate-900/40 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <SheetPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-[1001] flex w-full flex-col bg-card shadow-xl',
          side === 'right'
            ? 'right-0 max-w-md border-l border-border data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right'
            : 'left-0 max-w-[16rem] border-r border-border data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
          <X className="size-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 border-b border-border p-4 pr-10', className)} {...props} />
);

export const SheetTitle = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title className={cn('text-base font-semibold', className)} {...props} />
);

export const SheetDescription = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>) => (
  <SheetPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end', className)} {...props} />
);
