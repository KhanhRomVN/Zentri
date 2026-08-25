/**
 * AddPlatformModal — thêm nền tảng mới vào forge.
 * Hiển thị danh sách services từ DB (giống ServiceList trong email),
 * user chọn service thì form tự động điền thông tin.
 */

import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../components/ui/Modal';
import { cn } from '../../../../shared/lib/utils';
import { addPlatform, fetchAllServices } from '../../services/forgeService';
import { Platform } from '../../types';

interface AddPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

const AddPlatformModal = ({ isOpen, onClose, onAdded }: AddPlatformModalProps) => {
  const [services, setServices] = useState<Platform[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch services từ DB khi modal mở
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingServices(true);
    fetchAllServices()
      .then((rows) => setServices(rows))
      .catch((err) => console.error('[AddPlatformModal] Failed to fetch services:', err))
      .finally(() => setIsLoadingServices(false));
  }, [isOpen]);

  const handleSelectService = (service: Platform) => {
    setSelectedServiceId(service.id);
    setName(service.name || '');
    setUrl(service.url || '');
    setCategory(service.category || '');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Vui lòng chọn một nền tảng');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const platformId = selectedServiceId || name.trim().toLowerCase().replace(/\s+/g, '-');
      await addPlatform({
        id: platformId,
        name: name.trim(),
        url: url.trim() || undefined,
        category: category.trim() || 'forge',
      });
      setName('');
      setUrl('');
      setCategory('');
      setSelectedServiceId(null);
      onAdded?.();
      onClose();
    } catch (err) {
      console.error('[AddPlatformModal] Failed to add platform:', err);
      setError('Không thể thêm nền tảng, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px]">
      <ModalHeader title="Thêm nền tảng" onClose={onClose} />

      <ModalBody className="py-4">
        {/* Danh sách services từ DB */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-muted-foreground mb-2.5">
            Chọn nền tảng từ danh sách
          </label>
          {isLoadingServices ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Chưa có service nào trong database
            </div>
          ) : (
            <div className="max-h-[240px] overflow-y-auto border border-border rounded-lg">
              {services.map((service) => {
                const isSelected = service.id === selectedServiceId;
                const faviconUrl = service.url
                  ? `https://www.google.com/s2/favicons?domain=${service.url}&sz=64`
                  : '';
                const hostname = service.url
                  ? (() => {
                      try {
                        return new URL(service.url).hostname;
                      } catch {
                        return service.url;
                      }
                    })()
                  : '';
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelectService(service)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left border-b border-border last:border-b-0 transition-colors',
                      isSelected
                        ? 'bg-primary/10 border-primary/20'
                        : 'hover:bg-sidebar-item-hover',
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center p-1.5 border border-border shadow-sm shrink-0">
                      {faviconUrl && (
                        <img
                          src={faviconUrl}
                          className="w-full h-full object-contain"
                          alt=""
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{service.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {hostname || service.category || '—'}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-primary shrink-0">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Form tự điền */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Tên nền tảng
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chọn một nền tảng ở trên để tự điền"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="forge"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
          className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang thêm...' : 'Thêm nền tảng'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default AddPlatformModal;