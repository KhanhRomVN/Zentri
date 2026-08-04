import React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  children?: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  hideCloseButton?: boolean;
  hideBackButton?: boolean;
}