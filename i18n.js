const i18n = {
  en: {
    title: 'QuickTOC',
    levelPrefix: 'to H',
    lightMode: '☀️',
    darkMode: '🌙',
    optionsTitle: 'QuickTOC Options',
    hideSingleH1Label: 'Hide the H1 heading when there is only one on the page'
  },
  zh: {
    title: 'QuickTOC',
    levelPrefix: '到 H',
    lightMode: '☀️',
    darkMode: '🌙',
    optionsTitle: 'QuickTOC 选项',
    hideSingleH1Label: '当页面只有一个H1标题时隐藏该标题'
  }
};

// 获取当前语言设置
function getCurrentLang() {
  const lang = navigator.language.toLowerCase().split('-')[0];
  return i18n[lang] ? lang : 'en';  // 默认使用英语
}

// 获取翻译文本
function t(key) {
  const lang = getCurrentLang();
  return i18n[lang][key];
} 