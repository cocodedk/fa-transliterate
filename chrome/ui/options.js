const addMappingForm = document.getElementById('addMappingForm');
const latinInput = document.getElementById('latinInput');
const persianInput = document.getElementById('persianInput');
const customTableBody = document.querySelector('#customTable tbody');
const defaultTableBody = document.querySelector('#defaultTable tbody');
const statusElement = document.getElementById('status');

const defaultMappings = window.FaTransliterator
  ? [...window.FaTransliterator.DEFAULT_MAPPINGS]
  : [];

let customMappings = [];

const setStatus = (message, tone = 'info') => {
  statusElement.textContent = message || '';
  statusElement.dataset.tone = tone;
};

const renderDefaultMappings = () => {
  if (!defaultTableBody) {
    return;
  }
  const sorted = [...defaultMappings].sort((a, b) => {
    if (b.latin.length !== a.latin.length) {
      return b.latin.length - a.latin.length;
    }
    return a.latin.localeCompare(b.latin);
  });
  defaultTableBody.innerHTML = '';
  sorted.forEach((mapping) => {
    const row = document.createElement('tr');
    const latinCell = document.createElement('td');
    latinCell.textContent = mapping.latin;
    const persianCell = document.createElement('td');
    persianCell.textContent = mapping.persian;
    row.appendChild(latinCell);
    row.appendChild(persianCell);
    defaultTableBody.appendChild(row);
  });
};

const renderCustomMappings = () => {
  customTableBody.innerHTML = '';
  if (!customMappings.length) {
    const emptyRow = document.createElement('tr');
    const cell = document.createElement('td');
    cell.textContent = 'No custom mappings yet.';
    cell.colSpan = 3;
    emptyRow.appendChild(cell);
    customTableBody.appendChild(emptyRow);
    return;
  }

  customMappings.forEach((mapping) => {
    const row = document.createElement('tr');

    const latinCell = document.createElement('td');
    latinCell.textContent = mapping.latin;
    row.appendChild(latinCell);

    const persianCell = document.createElement('td');
    persianCell.textContent = mapping.persian;
    row.appendChild(persianCell);

    const actionCell = document.createElement('td');
    actionCell.className = 'actions';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.dataset.latin = mapping.latin;
    actionCell.appendChild(removeButton);
    row.appendChild(actionCell);

    customTableBody.appendChild(row);
  });
};

const saveCustomMappings = () => new Promise((resolve) => {
  chrome.runtime.sendMessage({ type: 'UPDATE_CUSTOM_MAPPINGS', customMappings }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus('Unable to save mappings.', 'error');
      resolve(false);
      return;
    }
    if (response && response.ok) {
      setStatus('Custom mappings saved.', 'success');
      resolve(true);
      return;
    }
    setStatus('Unexpected response while saving.', 'error');
    resolve(false);
  });
});

const normalizeLatin = (value) => value.trim().toLowerCase();
const normalizePersian = (value) => value.trim();

const upsertCustomMapping = (latin, persian) => {
  const index = customMappings.findIndex((entry) => entry.latin === latin);
  if (index >= 0) {
    customMappings[index] = { latin, persian };
  } else {
    customMappings.push({ latin, persian });
  }
  customMappings.sort((a, b) => a.latin.localeCompare(b.latin));
};

const removeCustomMapping = (latin) => {
  customMappings = customMappings.filter((entry) => entry.latin !== latin);
};

addMappingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const latin = normalizeLatin(latinInput.value);
  const persian = normalizePersian(persianInput.value);

  if (!latin || !persian) {
    setStatus('Provide both Latin and Persian values.', 'error');
    return;
  }

  if (!/^[a-z\-'`]+$/.test(latin)) {
    setStatus('Latin input must use a-z, apostrophe, hyphen, or backtick.', 'error');
    return;
  }

  upsertCustomMapping(latin, persian);
  renderCustomMappings();
  const saved = await saveCustomMappings();
  if (saved) {
    latinInput.value = '';
    persianInput.value = '';
    latinInput.focus();
  }
});

customTableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }
  const latin = button.dataset.latin;
  if (!latin) {
    return;
  }
  removeCustomMapping(latin);
  renderCustomMappings();
  await saveCustomMappings();
});

const loadSettings = () => {
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus('Unable to load settings.', 'error');
      return;
    }
    if (response && response.ok && response.result && response.result.settings) {
      customMappings = Array.isArray(response.result.settings.customMappings)
        ? [...response.result.settings.customMappings]
        : [];
      renderCustomMappings();
      setStatus('Settings loaded.', 'info');
    }
  });
};

renderDefaultMappings();
loadSettings();
