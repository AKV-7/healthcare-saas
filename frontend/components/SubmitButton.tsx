import Image from 'next/image';

import { ICONS } from '@/constants/cloudinary-assets';

import { Button } from './ui/button';

interface SubmitButtonProps {
  isLoading: boolean;
  className?: string;
  children: React.ReactNode;
  loadingText?: string;
}

export const SubmitButton = ({
  isLoading,
  className,
  children,
  loadingText = 'Loading...',
}: SubmitButtonProps) => {
  return (
    <Button type="submit" disabled={isLoading} className={className ?? 'shad-primary-btn w-full'}>
      {isLoading ? (
        <div className="flex items-center space-x-3">
          <Image
            src={ICONS['loader.svg']}
            alt="loading"
            width={24}
            height={24}
            className="animate-spin"
          />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
};
