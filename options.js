const DEFAULT_THEMES = {
  light: {
    font: '#333333',
    background: '#ffffff',
    icon: '#000000',
    activeHeader: '#333333',
    activeHeaderBackground: '#f5f5f5',
    titleFont: '#333333',
    titleBackground: '#f5f5f5',
  },
  dark: {
    font: '#e0e0e0',
    background: '#2d2d2d',
    icon: '#ffffff',
    activeHeader: '#e0e0e0',
    activeHeaderBackground: '#363636',
    titleFont: '#e0e0e0',
    titleBackground: '#363636',
  }
};

function setI18nText() {
  document.getElementById('pageTitle').textContent = t('optionsTitle');
  document.getElementById('optionsTitle').textContent = t('optionsTitle');
  document.getElementById('hideSingleH1Label').textContent = t('hideSingleH1Label');
  document.getElementById('fontSizeLabel').textContent = t('fontSizeLabel');
  document.getElementById('opacityLabel').textContent = t('opacityLabel');
  document.getElementById('lightThemeLegend').textContent = t('lightThemeLegend');
  document.getElementById('darkThemeLegend').textContent = t('darkThemeLegend');
  document.querySelectorAll('#fontColorLabel').forEach(el => el.textContent = t('fontColorLabel'));
  document.querySelectorAll('#backgroundColorLabel').forEach(el => el.textContent = t('backgroundColorLabel'));
  document.querySelectorAll('#iconColorLabel').forEach(el => el.textContent = t('iconColorLabel'));
  document.querySelectorAll('#activeHeaderColorLabel').forEach(el => el.textContent = t('activeHeaderColorLabel'));
  document.querySelectorAll('#activeHeaderBackgroundColorLabel').forEach(el => el.textContent = t('activeHeaderBackgroundColorLabel'));
  document.querySelectorAll('#titleFontColorLabel').forEach(el => el.textContent = t('titleFontColorLabel'));
  document.querySelectorAll('#titleBackgroundColorLabel').forEach(el => el.textContent = t('titleBackgroundColorLabel'));
  document.getElementById('resetThemes').textContent = t('resetThemes');
}

const hideSingleH1Checkbox = document.getElementById('hideSingleH1');
const fontSizeInput = document.getElementById('fontSize');
const opacitySlider = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const themeColorInputs = document.querySelectorAll('input[type="color"]');
const resetThemesButton = document.getElementById('resetThemes');

let currentThemes = {};

function populateThemeUI(themes) {
  currentThemes = themes;
  for (const themeName of ['light', 'dark']) {
    for (const colorName of Object.keys(themes[themeName])) {
      const input = document.getElementById(`${themeName}-${colorName}`);
      if (input) {
        input.value = themes[themeName][colorName];
      }
    }
  }
}

function saveThemes() {
  const newThemes = { light: {}, dark: {} };
  for (const themeName of ['light', 'dark']) {
    for (const colorName of Object.keys(DEFAULT_THEMES[themeName])) {
      const input = document.getElementById(`${themeName}-${colorName}`);
      if (input) {
        newThemes[themeName][colorName] = input.value;
      }
    }
  }
  chrome.storage.sync.set({ themes: newThemes });
}

chrome.storage.sync.get({
  hideSingleH1: true,
  fontSize: 12,
  opacity: 100,
  themes: DEFAULT_THEMES
}, (items) => {
  hideSingleH1Checkbox.checked = items.hideSingleH1;
  fontSizeInput.value = items.fontSize;
  opacitySlider.value = items.opacity;
  opacityValue.textContent = `${items.opacity}%`;
  
  const themes = {
    light: { ...DEFAULT_THEMES.light, ...items.themes.light },
    dark: { ...DEFAULT_THEMES.dark, ...items.themes.dark },
  };
  populateThemeUI(themes);
});

hideSingleH1Checkbox.addEventListener('change', () => {
  chrome.storage.sync.set({ hideSingleH1: hideSingleH1Checkbox.checked });
});

fontSizeInput.addEventListener('change', () => {
  chrome.storage.sync.set({ fontSize: parseInt(fontSizeInput.value, 10) });
});

opacitySlider.addEventListener('input', () => {
  const newOpacity = opacitySlider.value;
  opacityValue.textContent = `${newOpacity}%`;
  chrome.storage.sync.set({ opacity: parseInt(newOpacity, 10) });
});

themeColorInputs.forEach(input => {
  input.addEventListener('input', saveThemes);
});

resetThemesButton.addEventListener('click', () => {
  chrome.storage.sync.set({ themes: DEFAULT_THEMES }, () => {
    populateThemeUI(DEFAULT_THEMES);
  });
});

setI18nText();