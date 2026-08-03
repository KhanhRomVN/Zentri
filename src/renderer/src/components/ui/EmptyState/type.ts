import React from 'react';

export type EmptyStateVariant = 'default' | 'soft-info' | 'soft-success' | 'soft-warning' | 'soft-error';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: EmptyStateVariant;
  children?: React.ReactNode;
  className?: string;
}