import { useRef, useState } from 'react';

import { t } from '@/shared/lib/i18n';
import { ACCEPT_ATTRIBUTE, SUPPORTED_EXTENSIONS } from '../model/supportedFormats';

interface Props {
  onFile: (file: File) => void;
}

function UploadIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#406623"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

export function ModelDropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) onFile(files[0]);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={`flex w-full max-w-2xl flex-col items-center gap-5 rounded-3xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
        isDragging
          ? 'border-[#406623] bg-[#406623]/[0.06]'
          : 'border-[#C3C9B9] bg-white/60'
      }`}
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#406623]/10">
        <UploadIcon />
      </span>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold text-[#1B1C17]">
          {t('viewer.dropzone.title')}
        </h2>
        <p className="font-jakarta text-sm text-[#43493C]">
          {t('viewer.dropzone.hint')}
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-xl bg-[#406623] px-8 py-3 font-jakarta text-sm font-semibold tracking-[0.14px] text-white transition-colors hover:bg-[#34521c]"
      >
        {t('viewer.dropzone.button')}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <p className="max-w-md font-jakarta text-xs leading-5 text-[#43493C]/70">
        {t('viewer.dropzone.formats')}: {SUPPORTED_EXTENSIONS.join(', ')}
      </p>
    </div>
  );
}
