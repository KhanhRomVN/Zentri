import { FC, useState, useEffect, useRef, DragEvent, ClipboardEvent } from 'react';
import jsQR from 'jsqr';
import { UploadCloud, ClipboardPaste, ImagePlus, ScanLine } from 'lucide-react';
import { Modal, ModalHeader, ModalBody } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../shared/lib/utils';

interface QRCodeTOTPScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (totpSecret: string) => void;
}

function extractTotpSecret(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol === 'otpauth:') {
      return url.searchParams.get('secret') || null;
    }
  } catch {
    // not a URL, fall through
  }
  if (/^[A-Z2-7]+=*$/i.test(text)) {
    return text.toUpperCase().replace(/=+$/, '');
  }
  return null;
}

function decodeImageData(imageData: ImageData): string | null {
  const direct = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });
  if (direct?.data) return direct.data;
  const inverted = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return inverted?.data || null;
}

function loadImageToCanvas(src: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Cannot load image'));
    img.src = src;
  });
}

const QRCodeTOTPScannerModal: FC<QRCodeTOTPScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSource = async (src: string) => {
    setStatus('Decoding QR code...');
    setErrorMsg('');
    try {
      const canvas = await loadImageToCanvas(src);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = decodeImageData(imageData);
      if (!decoded) {
        setErrorMsg('No QR code found in the image.');
        setStatus('');
        return;
      }
      const secret = extractTotpSecret(decoded);
      if (!secret) {
        setErrorMsg('QR code does not contain a valid TOTP secret.');
        setStatus('');
        return;
      }
      setStatus('Success');
      onScanSuccess(secret);
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to process image.');
      setStatus('');
    }
  };

  const handleFile = (file: File | Blob | null) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    handleSource(objectUrl).finally(() => URL.revokeObjectURL(objectUrl));
  };

  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false);
      setStatus('');
      setErrorMsg('');
      return;
    }
    const handler = (e: Event) => {
      const clipboardEvent = e as unknown as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            clipboardEvent.preventDefault();
            handleFile(file);
            return;
          }
        }
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md" hideCloseButton>
      <ModalHeader title="Scan TOTP QR Code" onClose={onClose} />
      <ModalBody className="space-y-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-colors',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border bg-input-background/50 hover:border-primary/50',
          )}
        >
          <UploadCloud className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground/80">Drag & drop QR image here</p>
          <p className="text-[11px] text-muted-foreground/60">or</p>
          <Button variant="soft" size="sm" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="w-4 h-4" />
            Choose Image
          </Button>
          <p className="text-[11px] text-muted-foreground/50 mt-2 flex items-center gap-1.5">
            <ClipboardPaste className="w-3.5 h-3.5" />
            or press Ctrl+V to paste image from clipboard
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {status && !errorMsg && (
          <p className="text-sm font-medium text-success flex items-center gap-2">
            <ScanLine className="w-4 h-4" />
            {status}
          </p>
        )}
        {errorMsg && <p className="text-sm font-medium text-error">{errorMsg}</p>}
      </ModalBody>
    </Modal>
  );
};

export default QRCodeTOTPScannerModal;