const DEFAULT_SETTINGS = {
  globalEnabled: true,
  siteOverrides: {},
  customMappings: []
};

const STORAGE_KEY = 'faTransliterateSettings';

const CONTEXT_MENU_ID = 'fa-transliterate-selection';

async function rebuildContextMenus() {
  try {
    await chrome.contextMenus.removeAll();
  } catch (error) {
    // Ignore errors when context menus have not been created yet.
  }
  try {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Transliterate to Persian',
      contexts: ['editable']
    });
  } catch (error) {
    // Ignore creation errors (e.g., duplicate IDs).
  }
}

const getOriginFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch (error) {
    return null;
  }
};

const mergeSettings = (stored) => ({
  ...DEFAULT_SETTINGS,
  ...(stored || {})
});

async function getSettings() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  return mergeSettings(stored[STORAGE_KEY]);
}

async function saveSettings(partialUpdates) {
  const current = await getSettings();
  const next = mergeSettings({ ...current, ...partialUpdates });
  await chrome.storage.sync.set({ [STORAGE_KEY]: next });
  return next;
}

const isEnabledForOrigin = (settings, origin) => {
  if (!settings.globalEnabled) {
    return false;
  }
  if (!origin) {
    return settings.globalEnabled;
  }
  if (Object.prototype.hasOwnProperty.call(settings.siteOverrides, origin)) {
    return Boolean(settings.siteOverrides[origin]);
  }
  return true;
};

const cleanOverrides = (overrides) => {
  const cleaned = { ...overrides };
  Object.keys(cleaned).forEach((origin) => {
    const value = cleaned[origin];
    if (value === true) {
      // True matches default global enabled state; keep explicit false overrides only.
      delete cleaned[origin];
    }
  });
  return cleaned;
};

async function toggleGlobalEnabled() {
  const settings = await getSettings();
  const next = await saveSettings({
    globalEnabled: !settings.globalEnabled
  });
  await broadcastSettings(next);
  return next;
}

async function toggleSiteEnabled(origin) {
  if (!origin) {
    return getSettings();
  }
  const settings = await getSettings();
  const current = Object.prototype.hasOwnProperty.call(settings.siteOverrides, origin)
    ? Boolean(settings.siteOverrides[origin])
    : true;
  const nextOverrides = {
    ...settings.siteOverrides,
    [origin]: !current
  };
  const cleanedOverrides = !nextOverrides[origin] ? nextOverrides : cleanOverrides(nextOverrides);
  const updated = await saveSettings({ siteOverrides: cleanedOverrides });
  await broadcastSettings(updated);
  return updated;
}

async function updateCustomMappings(customMappings = []) {
  const sanitized = Array.isArray(customMappings)
    ? customMappings
      .filter((entry) => entry && typeof entry.latin === 'string' && typeof entry.persian === 'string')
      .map((entry) => ({
        latin: entry.latin.trim().toLowerCase(),
        persian: entry.persian.trim()
      }))
    : [];
  const settings = await saveSettings({ customMappings: sanitized });
  await broadcastSettings(settings);
  return settings;
}

async function ensureDefaults() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  if (!stored[STORAGE_KEY]) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
  }
}

async function updateBadgeForTab(tabId, settings) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url) {
      return;
    }
    const origin = getOriginFromUrl(tab.url);
    const resolvedSettings = settings || await getSettings();
    const enabled = isEnabledForOrigin(resolvedSettings, origin);
    await chrome.action.setBadgeBackgroundColor({ tabId, color: enabled ? '#0b8043' : '#bdbdbd' });
    await chrome.action.setBadgeText({ tabId, text: enabled ? 'ON' : '' });
  } catch (error) {
    // Tab may not exist (e.g., closed) or url is restricted; ignore.
  }
}

async function refreshAllBadges() {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => updateBadgeForTab(tab.id, settings)));
}

async function broadcastSettings(settings) {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map(async (tab) => {
    if (!tab.id || !tab.url) {
      return;
    }
    const origin = getOriginFromUrl(tab.url);
    const enabled = isEnabledForOrigin(settings, origin);
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_SYNC',
        settings,
        enabled
      });
    } catch (error) {
      // Ignore tabs that cannot receive messages (e.g., chrome:// URLs).
    }
  }));
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await refreshAllBadges();
  await rebuildContextMenus();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await refreshAllBadges();
  await rebuildContextMenus();
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await updateBadgeForTab(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    await updateBadgeForTab(tabId);
  }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'sync' && changes[STORAGE_KEY]) {
    await refreshAllBadges();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message || {};

  const handleAsync = (promise) => {
    promise
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => {
        sendResponse({ ok: false, error: error.message || 'Unexpected error' });
      });
  };

  switch (type) {
    case 'GET_SETTINGS': {
      const origin = message.origin || (sender && sender.url ? getOriginFromUrl(sender.url) : null);
      handleAsync((async () => {
        const settings = await getSettings();
        const enabled = isEnabledForOrigin(settings, origin);
        return { settings, enabled };
      })());
      break;
    }
    case 'TOGGLE_GLOBAL': {
      const origin = message.origin || (sender && sender.tab && sender.tab.url ? getOriginFromUrl(sender.tab.url) : null);
      handleAsync((async () => {
        const settings = await toggleGlobalEnabled();
        const tabId = sender && sender.tab ? sender.tab.id : null;
        if (tabId) {
          await updateBadgeForTab(tabId, settings);
        } else {
          await refreshAllBadges();
        }
        const enabled = isEnabledForOrigin(settings, origin);
        return { settings, enabled };
      })());
      break;
    }
    case 'TOGGLE_SITE': {
      handleAsync((async () => {
        const origin = message.origin;
        const settings = await toggleSiteEnabled(origin);
        const tabId = sender && sender.tab ? sender.tab.id : null;
        if (tabId) {
          await updateBadgeForTab(tabId, settings);
        } else {
          await refreshAllBadges();
        }
        return { settings, enabled: isEnabledForOrigin(settings, origin) };
      })());
      break;
    }
    case 'UPDATE_CUSTOM_MAPPINGS': {
      handleAsync((async () => {
        const settings = await updateCustomMappings(message.customMappings);
        await refreshAllBadges();
        return { settings };
      })());
      break;
    }
    default:
      return false;
  }

  return true;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab || !tab.id) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'CONTEXT_TRANSLITERATE_SELECTION' });
  } catch (error) {
    // Tab may not accept messages; ignore.
  }
});
