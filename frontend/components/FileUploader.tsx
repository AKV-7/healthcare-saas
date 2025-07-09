'use client';

import Image from 'next/image';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import { ICONS } from '@/constants/cloudinary-assets';
import { convertFileToUrl } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
  'application/pdf': ['.pdf'],
} as const;

interface FileUploaderProps {
  files: File[] | undefined;
  onChange: (files: File[]) => void;
}

const isImageFile = (file: File) => file.type.startsWith('image/');

export const FileUploader = ({ files, onChange }: FileUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const existingFiles = files || [];
    const newFiles = [...existingFiles, ...acceptedFiles];
    onChange(newFiles);
  }, [files, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  return (
    <div 
      {...getRootProps()} 
      className={`file-upload cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragActive 
          ? 'border-rose-400 bg-rose-50 dark:border-rose-500 dark:bg-rose-900/20' 
          : 'border-gray-300 bg-gray-50 hover:border-rose-400 hover:bg-rose-50 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-rose-500 dark:hover:bg-rose-900/20'
      }`}
    >
      <input {...getInputProps()} />
      {files && files.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {files.map((file, index) => (
              <div key={index} className="relative">
                {isImageFile(file) ? (
                  <Image
                    src={convertFileToUrl(file)}
                    width={150}
                    height={150}
                    alt={`uploaded image ${index + 1}`}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700/50">
                    <Image
                      src={ICONS['upload.svg']}
                      width={24}
                      height={24}
                      alt="document"
                    />
                  </div>
                )}
                <p className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {files.length} file{files.length > 1 ? 's' : ''} selected. Click or drag more files to add them.
          </p>
        </div>
      ) : (
        <>
          <Image
            src={ICONS['upload.svg']}
            width={40}
            height={40}
            alt="upload"
            className="mx-auto mb-4"
          />
          <div className="file-upload_label">
            <p className="mb-2 text-sm font-normal">
              <span className="font-medium text-rose-500">Click to upload </span>
              or drag and drop
            </p>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Images (JPEG, PNG, GIF) or PDF files (max. 5MB each)
            </p>
          </div>
        </>
      )}
    </div>
  );
};
