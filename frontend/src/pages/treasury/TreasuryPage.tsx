import { useState } from 'react';
import { Landmark } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type Column } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/tables/status-badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/tables/confirm-dialog';
import { usePaymentQueue, useReleasePayment } from '@/hooks/useTreasury';
import { formatINRPrecise } from '@/lib/format';
import type { Payment } from '@/types';

export function TreasuryPage() {
  const { data: payments = [], isLoading } = usePaymentQueue();
  const releasePayment = useReleasePayment();
  const [target, setTarget] = useState<Payment | null>(null);

  const columns: Column<Payment>[] = [
    { key: 'bill_no', header: 'Bill No.', render: (p) => <span className="font-medium text-foreground">{p.bill_no}</span> },
    { key: 'contractor', header: 'Contractor', render: (p) => p.contractor_name },
    { key: 'amount', header: 'Amount', render: (p) => <span className="font-medium">{formatINRPrecise(p.amount)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: '',
      render: (p) =>
        p.status !== 'RELEASED' ? (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); setTarget(p); }}>
            <Landmark /> Release Payment
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="Treasury" description="Payment queue for approved RA bills" />

      <div className="rounded-lg border border-border bg-card">
        <DataTable columns={columns} data={payments} rowKey={(p) => p.id} isLoading={isLoading} emptyTitle="No payments in the queue" />
      </div>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Release this payment?"
        description={target ? `${formatINRPrecise(target.amount)} will be released to ${target.contractor_name} for bill ${target.bill_no}.` : undefined}
        confirmLabel="Release payment"
        loading={releasePayment.isPending}
        onConfirm={async () => {
          if (!target) return;
          await releasePayment.mutateAsync(target.id);
          setTarget(null);
        }}
      />
    </div>
  );
}
