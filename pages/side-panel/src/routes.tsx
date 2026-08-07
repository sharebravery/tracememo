import { t } from '@extension/i18n';

type TabId = 'current' | 'library' | 'settings';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: readonly TabDef[] = [
  { id: 'current', label: t('tab_current_page') },
  { id: 'library', label: t('tab_library') },
  { id: 'settings', label: t('tab_settings') },
] as const;

export { TABS, type TabId, type TabDef };
