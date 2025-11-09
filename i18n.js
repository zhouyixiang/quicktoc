var i18n = {
  en: {
    title: 'QuickTOC',
    levelPrefix: 'to H',
    lightMode: '☀️',
    darkMode: '🌙',
    optionsTitle: 'QuickTOC Options',
    hideSingleH1Label: 'Hide the H1 heading when there is only one on the page',
    fontSizeLabel: 'Font Size',
    opacityLabel: 'Opacity',
    lightThemeLegend: 'Light Theme',
    darkThemeLegend: 'Dark Theme',
    fontColorLabel: 'Font Color',
    backgroundColorLabel: 'Background Color',
    iconColorLabel: 'Icon Color',
    activeHeaderColorLabel: 'Active Header Color',
    activeHeaderBackgroundColorLabel: 'Active Header Background Color',
    resetThemes: 'Reset Themes',
    titleFontColorLabel: 'Title Font Color',
    titleBackgroundColorLabel: 'Title Background Color'
  },
  zh: {
    title: 'QuickTOC',
    levelPrefix: '到 H',
    lightMode: '☀️',
    darkMode: '🌙',
    optionsTitle: 'QuickTOC 选项',
    hideSingleH1Label: '当页面只有一个H1标题时隐藏该标题',
    fontSizeLabel: '字体大小',
    opacityLabel: '透明度',
    lightThemeLegend: '浅色主题',
    darkThemeLegend: '深色主题',
    fontColorLabel: '字体颜色',
    backgroundColorLabel: '背景颜色',
    iconColorLabel: '图标颜色',
    activeHeaderColorLabel: '活动标题颜色',
    activeHeaderBackgroundColorLabel: '活动标题背景颜色',
    resetThemes: '重置主题',
    titleFontColorLabel: '标题字体颜色',
    titleBackgroundColorLabel: '标题背景颜色'
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