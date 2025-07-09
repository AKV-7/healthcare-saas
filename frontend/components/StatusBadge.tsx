import clsx from 'clsx';
import Image from 'next/image';

import { StatusIcon } from '@/constants';
import { Appointment } from '@/lib/api';

type AppointmentStatus = Appointment['status'];

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string }> = {
  confirmed: { bg: 'bg-green-600', text: 'text-green-500' },
  completed: { bg: 'bg-green-600', text: 'text-green-500' },
  pending: { bg: 'bg-blue-600', text: 'text-blue-500' },
  cancelled: { bg: 'bg-red-600', text: 'text-red-500' },
  'no-show': { bg: 'bg-red-600', text: 'text-red-500' },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const colors = STATUS_COLORS[status];

  return (
    <div className={clsx('status-badge', colors.bg)}>
      <Image src={StatusIcon[status]} alt={status} width={24} height={24} className="size-3" />
      <p className={clsx('text-xs font-semibold capitalize', colors.text)}>
        {status}
      </p>
    </div>
  );
};
