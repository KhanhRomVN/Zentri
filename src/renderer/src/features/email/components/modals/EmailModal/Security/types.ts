/**
 * Shared types for SecurityTab sub-components.
 */

import type { Account } from '../../../../types';

export interface SecurityTabProps {
  account: Account | null;
}

export interface FingerprintEntry {
  domain: string;
  fingerprint_hash: string;
  fingerprint_config_json: string | null;
  public_ip: string;
  ip_info_json: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface SecurityWarning {
  severity: 'critical' | 'warning';
  title: string;
  sub: string;
  fix: string;
}

export interface BreakdownItem {
  label: string;
  score: number;
  max: number;
  zone: 'critical' | 'warn' | 'mid' | 'ok';
  icon: React.ReactNode;
}
