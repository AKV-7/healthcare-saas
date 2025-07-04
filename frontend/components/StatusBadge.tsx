import clsx from 'clsx';
import Image from 'next/image';

import { StatusIcon } from '@/constants';
import { Appointment } from '@/lib/api';

export const StatusBadge = ({ status }: { status: Appointment['status'] }) => {
  return (
    <div
      className={clsx('status-badge', {
        'bg-green-600': status === 'confirmed' || status === 'completed',
        'bg-blue-600': status === 'pending',
        'bg-red-600': status === 'cancelled' || status === 'no-show',
      })}
    >
      <Image src={StatusIcon[status]} alt="status" width={24} height={24} className="h-fit w-3" />
      <p
        className={clsx('text-12-semibold capitalize', {
          'text-green-500': status === 'confirmed' || status === 'completed',
          'text-blue-500': status === 'pending',
          'text-red-500': status === 'cancelled' || status === 'no-show',
        })}
      >
        {status}
      </p>
    </div>
  );
};
