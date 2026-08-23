import { memo } from 'react';
import Modal from '../../../../components/ui/Modal/Modal';
import ModalHeader from '../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../components/ui/Modal/ModalBody';
import ModalFooter from '../../../../components/ui/Modal/ModalFooter';

interface ConfirmActionTypeChangeModalProps {
  isOpen: boolean;
  currentActionType: string;
  newActionType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmActionTypeChangeModal = memo(
  ({
    isOpen,
    currentActionType,
    newActionType,
    onConfirm,
    onCancel,
  }: ConfirmActionTypeChangeModalProps) => {
    return (
      <Modal isOpen={isOpen} onClose={onCancel} className="max-w-md">
        <ModalHeader
          title="Xác nhận thay đổi Action Type"
          description="Cảnh báo"
          onClose={onCancel}
        />
        <ModalBody>
          <div className="space-y-3">
            <p className="text-sm text-text-primary">
              Bạn đang thay đổi loại action. Nếu tiếp tục, tất cả các giá trị cấu hình hiện tại của
              action này sẽ <span className="font-semibold text-error">không thể khôi phục</span>{' '}
              lại được.
            </p>
            <p className="text-sm text-text-secondary">
              Bạn có chắc chắn muốn thay đổi từ{' '}
              <span className="font-medium text-text-primary">{currentActionType}</span> sang{' '}
              <span className="font-medium text-text-primary">{newActionType}</span>?
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-error/90"
          >
            Xác nhận thay đổi
          </button>
        </ModalFooter>
      </Modal>
    );
  },
);

ConfirmActionTypeChangeModal.displayName = 'ConfirmActionTypeChangeModal';
