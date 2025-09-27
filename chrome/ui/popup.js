const globalToggle = document.getElementById('globalToggle');
const siteToggle = document.getElementById('siteToggle');
const siteToggleRow = document.getElementById('siteToggleRow');
const statusMessage = document.getElementById('statusMessage');
const openOptionsButton = document.getElementById('openOptions');

let suppressToggleEvents = false;
let currentOrigin = null;

const getOrigin = (url) => {
  try {
    return new URL(url).origin;
  } catch (error) {
    return null;
  }
};

const getActiveTab = () => new Promise((resolve) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    resolve(tabs && tabs.length ? tabs[0] : null);
  });
});

const renderState = (payload) => {
  if (!payload || !payload.settings) {
    return;
  }
  const globalEnabled = Boolean(payload.settings.globalEnabled);
  const siteEnabled = Boolean(payload.enabled);

  suppressToggleEvents = true;
  globalToggle.checked = globalEnabled;
  siteToggle.checked = siteEnabled;
  siteToggle.disabled = !globalEnabled || !currentOrigin;
  siteToggleRow.style.display = currentOrigin ? 'flex' : 'none';

  if (!globalEnabled) {
    statusMessage.textContent = 'Global transliteration is disabled.';
  } else if (!currentOrigin) {
    statusMessage.textContent = 'Unavailable for this page type.';
  } else if (siteEnabled) {
    statusMessage.textContent = 'Transliteration is active on this site.';
  } else {
    statusMessage.textContent = 'Transliteration is disabled on this site.';
  }
  suppressToggleEvents = false;
};

const fetchAndRenderState = async () => {
  const tab = await getActiveTab();
  currentOrigin = tab && tab.url ? getOrigin(tab.url) : null;
  const request = currentOrigin ? { type: 'GET_SETTINGS', origin: currentOrigin } : { type: 'GET_SETTINGS' };
  chrome.runtime.sendMessage(request, (response) => {
    if (chrome.runtime.lastError) {
      statusMessage.textContent = 'Unable to read extension state.';
      return;
    }
    if (response && response.ok && response.result) {
      renderState(response.result);
    }
  });
};

globalToggle.addEventListener('change', () => {
  if (suppressToggleEvents) {
    return;
  }
  chrome.runtime.sendMessage({ type: 'TOGGLE_GLOBAL', origin: currentOrigin }, (response) => {
    if (chrome.runtime.lastError) {
      return;
    }
    if (response && response.ok && response.result) {
      renderState(response.result);
    }
  });
});

siteToggle.addEventListener('change', () => {
  if (suppressToggleEvents || !currentOrigin) {
    return;
  }
  chrome.runtime.sendMessage({ type: 'TOGGLE_SITE', origin: currentOrigin }, (response) => {
    if (chrome.runtime.lastError) {
      return;
    }
    if (response && response.ok && response.result) {
      renderState(response.result);
    }
  });
});

openOptionsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

fetchAndRenderState();
