import { Badge, type BadgeTone } from '@/components/ui/badge';
import { humanize } from '@/lib/format';

const TONE_MAP: Record<string, BadgeTone> = {
  // Project status
  PLANNED: 'neutral',
  ACTIVE: 'primary',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  // Inspection
  PASS: 'success',
  FAIL: 'danger',
  // Workflow stage
  SUBMITTED: 'primary',
  ENGINEER_REVIEW: 'accent',
  FINANCE_REVIEW: 'warning',
  TREASURY: 'secondary',
  PAID: 'success',
  // Bill / payment status
  DRAFT: 'neutral',
  UNDER_REVIEW: 'warning',
  RETURNED: 'danger',
  APPROVED: 'success',
  PENDING: 'neutral',
  READY: 'primary',
  RELEASED: 'success',
  // Priority
  LOW: 'neutral',
  MEDIUM: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
};

export function StatusBadge({ status }: { status?: string | null }) {
  const key = (status ?? '').toUpperCase();
  return <Badge tone={TONE_MAP[key] ?? 'neutral'}>{humanize(status)}</Badge>;
}
