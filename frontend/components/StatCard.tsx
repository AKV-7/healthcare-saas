import clsx from 'clsx';
import Image from 'next/image';

type StatCardType = 'appointments' | 'pending' | 'cancelled' | 'completed';

const STAT_CARD_BACKGROUNDS: Record<StatCardType, string> = {
  appointments: 'bg-appointments',
  pending: 'bg-pending',
  cancelled: 'bg-cancelled',
  completed: 'bg-completed',
};

interface StatCardProps {
  type: StatCardType;
  count: number;
  label: string;
  icon: string;
}

export const StatCard = ({ count = 0, label, icon, type }: StatCardProps) => {
  return (
    <div className={clsx('stat-card', STAT_CARD_BACKGROUNDS[type])}>
      <div className="flex items-center gap-4">
        <Image src={icon} height={32} width={32} alt={type} className="size-8" />
        <h2 className="text-3xl font-bold text-white">{count}</h2>
      </div>

      <p className="text-sm font-normal">{label}</p>
    </div>
  );
};
