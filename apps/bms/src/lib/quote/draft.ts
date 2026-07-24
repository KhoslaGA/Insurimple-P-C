/**
 * TR.2 save/resume. A partial quote is persisted so it can be resumed, and a
 * duplicate is detectable (a saved draft already exists for the household).
 * Persistence here is localStorage — swapped for the NestJS API when it's wired.
 */
import type { Risk } from '@insurimple/contracts';

export interface QuoteDraft {
  householdId: string;
  updatedAt: string;
  risk: Risk;
}

const PREFIX = 'insurimple.quote.draft';
const keyFor = (householdId: string) => `${PREFIX}.${householdId}`;

/** Pure round-trip — the tested core of resume. */
export function serializeDraft(draft: QuoteDraft): string {
  return JSON.stringify(draft);
}
export function deserializeDraft(raw: string): QuoteDraft {
  return JSON.parse(raw) as QuoteDraft;
}

export function saveDraft(draft: QuoteDraft): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(keyFor(draft.householdId), serializeDraft(draft));
}
export function loadDraft(householdId: string): QuoteDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(keyFor(householdId));
  return raw ? deserializeDraft(raw) : null;
}
export function clearDraft(householdId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(keyFor(householdId));
}
