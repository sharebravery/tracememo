import manifest from './manifest';
import { describe, expect, it } from 'vitest';

/**
 * Manifest policy + snapshot test.
 *
 * Enforces the non-negotiable MVP permission surface from
 * docs/02-TECHNICAL-ARCHITECTURE.md section 5.1 and the PRD security rules.
 * This test must fail before any forbidden permission, host, or surface is
 * added to the manifest.
 */
describe('TraceMemo manifest', () => {
  it('matches the baseline snapshot', () => {
    expect(manifest).toMatchSnapshot();
  });

  it('is Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('declares only the allowed permissions', () => {
    expect(manifest.permissions).toEqual(['storage', 'sidePanel']);
  });

  it('does not declare any forbidden permission', () => {
    const forbidden = [
      'tabs',
      'scripting',
      'notifications',
      'cookies',
      'history',
      'webRequest',
      'declarativeNetRequest',
      'clipboardRead',
      'clipboardWrite',
      'alarms',
      'identity',
    ];
    for (const permission of forbidden) {
      expect(manifest.permissions).not.toContain(permission);
    }
  });

  it('never requests <all_urls> anywhere', () => {
    const serialized = JSON.stringify(manifest);
    expect(serialized).not.toContain('<all_urls>');
  });

  it('scopes host permissions to the supported explorers', () => {
    expect(manifest.host_permissions).toEqual(['https://etherscan.io/*', 'https://basescan.org/*']);
  });

  it('scopes content scripts to the supported explorers only', () => {
    const allowed = new Set(['https://etherscan.io/*', 'https://basescan.org/*']);
    for (const script of manifest.content_scripts ?? []) {
      expect(script.matches.length).toBeGreaterThan(0);
      for (const match of script.matches) {
        expect(allowed.has(match)).toBe(true);
      }
    }
  });

  it('has no popup', () => {
    expect(manifest.action).toBeDefined();
    expect(manifest.action).not.toHaveProperty('default_popup');
  });

  it('has no new-tab override, options page, or devtools page', () => {
    expect(manifest).not.toHaveProperty('chrome_url_overrides');
    expect(manifest).not.toHaveProperty('options_page');
    expect(manifest).not.toHaveProperty('options_ui');
    expect(manifest).not.toHaveProperty('devtools_page');
  });

  it('has no broad web_accessible_resources matches', () => {
    const broad = ['*://*/*', '<all_urls>', 'http://*/*', 'https://*/*'];
    const war = (manifest as chrome.runtime.ManifestV3).web_accessible_resources ?? [];
    for (const entry of war) {
      for (const match of entry.matches) {
        expect(broad).not.toContain(match);
      }
    }
  });

  it('opens the side panel on toolbar click', () => {
    expect(manifest.side_panel?.default_path).toBe('side-panel/index.html');
  });

  it('uses the default en locale', () => {
    expect(manifest.default_locale).toBe('en');
  });

  it('registers the background service worker as a module', () => {
    expect(manifest.background).toEqual({ service_worker: 'background.js', type: 'module' });
  });
});
