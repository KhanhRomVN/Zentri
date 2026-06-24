import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ServiceProviderConfig } from '../features/email/types';
import ServiceDrawer from '../features/setting/components/Service/ServiceDrawer';

interface ServiceDrawerContextType {
  openDrawer: (editService?: Partial<ServiceProviderConfig> | null, isNew?: boolean, onClose?: () => void) => void;
  closeDrawer: () => void;
  isOpen: boolean;
}

const ServiceDrawerContext = createContext<ServiceDrawerContextType | undefined>(undefined);

export const useServiceDrawer = () => {
  const context = useContext(ServiceDrawerContext);
  if (!context) {
    throw new Error('useServiceDrawer must be used within a ServiceDrawerProvider');
  }
  return context;
};

interface ServiceDrawerProviderProps {
  children: ReactNode;
  onSave?: (data: Partial<ServiceProviderConfig>, metadata: { key: string; value: string }[], authMethods: string[]) => Promise<void>;
}

export const ServiceDrawerProvider: React.FC<ServiceDrawerProviderProps> = ({ children, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editService, setEditService] = useState<Partial<ServiceProviderConfig> | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [closeCallback, setCloseCallback] = useState<(() => void) | null>(null);

  const openDrawer = (editService?: Partial<ServiceProviderConfig> | null, isNew: boolean = true, onClose?: () => void) => {
    setEditService(editService || null);
    setIsNew(isNew);
    setIsOpen(true);
    if (onClose) {
      setCloseCallback(() => onClose);
    } else {
      setCloseCallback(null);
    }
  };

  const closeDrawer = () => {
    setIsOpen(false);
    setEditService(null);
    if (closeCallback) {
      closeCallback();
      setCloseCallback(null);
    }
  };

  const handleSave = async (
    data: Partial<ServiceProviderConfig>,
    metadata: { key: string; value: string }[],
    authMethods: string[],
  ) => {
    if (onSave) {
      await onSave(data, metadata, authMethods);
    }
    closeDrawer();
  };

  return (
    <ServiceDrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
      {children}
      <ServiceDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        onSave={handleSave}
        editService={editService}
        isNew={isNew}
      />
    </ServiceDrawerContext.Provider>
  );
};