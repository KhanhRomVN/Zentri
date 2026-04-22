import { useState, useCallback } from 'react';

interface LaunchOptions {
  accountId: string;
  email: string;
  url?: string;
  provider?: string;
}

export const useHealthCheck = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<LaunchOptions | null>(null);

  const launchWithCheck = useCallback((opts: LaunchOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeHealthCheck = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  return {
    isOpen,
    options,
    launchWithCheck,
    closeHealthCheck,
  };
};
