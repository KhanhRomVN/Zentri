/**
 * ------------------------------------------------------------------
 * FORGE Types
 * ------------------------------------------------------------------
 * Type definitions cho FORGE feature.
 * Mapping với DB hiện có:
 * - Platform = Service (bảng services)
 * - Account  = Email (bảng emails)
 * - Session  = Session (bảng sessions)
 * ------------------------------------------------------------------
 */

import { Service, Email, Session } from '../../../types/db';

// ─── Platform ──────────────────────────────────────────────────────────────
export type Platform = Service;

// ─── Account ──────────────────────────────────────────────────────────────
export interface ForgeAccount extends Email {
  platformId?: string;
  platformName?: string;
  sessionId?: string;
}

// ─── Session ──────────────────────────────────────────────────────────────
export interface ForgeSession extends Session {
  platformId?: string;
  platformName?: string;
  accountCount?: number;
}

// ─── View State ───────────────────────────────────────────────────────────
export type ForgeView = 'dashboard' | 'platform' | 'session';

export interface ForgeNavigationState {
  view: ForgeView;
  platformId?: string;
  sessionId?: string;
}