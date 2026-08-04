/**
 * Side-panel tab definitions. MVP ships three views: Current Page, Library,
 * and Settings. See docs/02-TECHNICAL-ARCHITECTURE.md section 10.1.
 */
export type TabId = 'current' | 'library' | 'settings';

export interface TabDef {
  id: TabId;
  label: string;
}

export const TABS: readonly TabDef[] = [
  { id: 'current', label: 'Current Page' },
  { id: 'library', label: 'Library' },
  { id: 'settings', label: 'Settings' },
] as const;
