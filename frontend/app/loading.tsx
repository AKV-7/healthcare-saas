import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex-center size-full h-screen gap-3 text-white">
      <Image
        src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455266/healthcare/icons/healthcare/icons/loader.svg"
        alt="loader"
        width={40}
        height={3240}
        className="animate-spin"
      />
      Loading...
    </div>
  );
}
