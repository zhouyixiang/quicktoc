var DEFAULT_THEMES = {
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

if (!window.tocGenerator) {
  class TOCGenerator {
    constructor() {
      this.toc = null;
      this.headings = [];
      this.minLevel = 6;
      this.isDragging = false;
      this.isResizing = false;
      this.resizeDirection = null;
      this.initialSize = { width: 0, height: 0 };
      this.initialPosition = { x: 0, y: 0 };
      this.dragOffset = { x: 0, y: 0 };
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.activeHeading = null;
      this.observer = null;
    }

    init() {
      this.generateTOC();
      this.setupEventListeners();
      this.setupIntersectionObserver();
    }

    toggleVisibility() {
      if (this.toc) {
        const isVisible = this.toc.style.display !== 'none';
        this.toc.style.display = isVisible ? 'none' : 'flex';
      }
    }

    applyTheme() {
      chrome.storage.sync.get({ themes: DEFAULT_THEMES }, (items) => {
        const theme = this.isDarkMode ? items.themes.dark : items.themes.light;
        const styleId = 'quicktoc-theme-styles';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = `
          .page-toc {
            background-color: ${theme.background} !important;
            color: ${theme.font} !important;
          }
          .page-toc-header {
            background-color: ${theme.activeHeaderBackground} !important;
          }
          .page-toc-title {
            color: ${theme.titleFont} !important;
            background-color: ${theme.titleBackground} !important;
          }
          .page-toc-level-select {
            color: ${theme.titleFont} !important;
            background-color: ${theme.titleBackground} !important;
          }
          .page-toc-collapse-all, .page-toc-expand-all, .page-toc-theme-toggle, .page-toc-close {
            color: ${theme.icon} !important;
          }
          .page-toc.dark-mode .page-toc-item-text:hover {
            color: #66b3ff;
          }
          .page-toc-item-text:hover {
            color: #0066cc;
          }
          .page-toc-item.active {
            background-color: ${theme.activeHeaderBackground} !important;
          }
          .page-toc-item.active > .page-toc-item-text {
            color: ${theme.activeHeader} !important;
            font-weight: bold;
          }
        `;
      });
    }

    generateTOC() {
      // 获取所有标题元素
      this.headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      if (this.headings.length === 0) return;

      // 创建TOC容器
      this.toc = document.createElement('div');
      this.toc.className = 'page-toc';
      chrome.storage.sync.get({opacity: 100}, (items) => {
        this.toc.style.opacity = items.opacity / 100;
      });
      
      // 创建TOC头部
      const header = document.createElement('div');
      header.className = 'page-toc-header';
      
      const title = document.createElement('span');
      title.className = 'page-toc-title';
      title.textContent = t('title');
      
      const controls = document.createElement('div');
      controls.className = 'page-toc-controls';

      // 创建展开/折叠按钮
      const collapseAllButton = document.createElement('button');
      collapseAllButton.className = 'page-toc-collapse-all';
      collapseAllButton.title = 'Collapse All';
      collapseAllButton.innerHTML = ICONS.collapse;
      const expandAllButton = document.createElement('button');
      expandAllButton.className = 'page-toc-expand-all';
      expandAllButton.title = 'Expand All';
      expandAllButton.innerHTML = ICONS.expand;
      
      // 创建主题切换按钮
      const themeToggle = document.createElement('button');
      themeToggle.className = 'page-toc-theme-toggle';
      themeToggle.innerHTML = this.isDarkMode ? ICONS.moon : ICONS.sun;
      
      // 创建级别选择器
      const levelSelect = document.createElement('select');
      levelSelect.className = 'page-toc-level-select';
      for (let i = 1; i <= 6; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = `${t('levelPrefix')}${i}`;
        if (i === 6) {
          option.selected = true;
        }
        levelSelect.appendChild(option);
      }
      
      // 创建关闭按钮
      const closeButton = document.createElement('button');
      closeButton.className = 'page-toc-close';
      closeButton.innerHTML = '×';
      
      controls.appendChild(themeToggle);
      controls.appendChild(collapseAllButton);
      controls.appendChild(expandAllButton);
      controls.appendChild(levelSelect);
      controls.appendChild(closeButton);
      header.appendChild(title);
      header.appendChild(controls);
      
      // 创建TOC内容区
      const content = document.createElement('div');
      content.className = 'page-toc-content';
      
      // 创建目录列表
      const list = document.createElement('ul');
      list.className = 'page-toc-list';
      
      // 添加目录项
      this.updateTOCContent(list);
      
      content.appendChild(list);
      this.toc.appendChild(header);
      this.toc.appendChild(content);
      
      // 添加调整大小的手柄
      const resizeDirections = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      resizeDirections.forEach(direction => {
        const handle = document.createElement('div');
        handle.className = `page-toc-resize page-toc-resize-${direction}`;
        this.toc.appendChild(handle);
      });
      
      document.body.appendChild(this.toc);

      this.applyTheme();
    }

    updateTOCContent(list) {
        chrome.storage.sync.get({ hideSingleH1: true, fontSize: 14 }, (items) => {
            list.innerHTML = '';
            list.style.fontSize = `${items.fontSize}px`;
            const h1s = this.headings.filter(h => h.tagName === 'H1');
            const hideSingleH1 = items.hideSingleH1 && h1s.length === 1;

            const tocRoots = [];
            let currentTocItems = {};

            this.headings.forEach((heading, index) => {
                if (hideSingleH1 && heading.tagName === 'H1') return;

                const level = parseInt(heading.tagName.substring(1));
                if (level > this.minLevel) return;

                const tocItem = document.createElement('li');
                tocItem.className = `page-toc-item page-toc-h${level}`;
                heading.tocItem = tocItem;

                const textSpan = document.createElement('span');
                textSpan.className = 'page-toc-item-text';
                textSpan.textContent = heading.textContent;
                tocItem.appendChild(textSpan);

                textSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    heading.scrollIntoView({ behavior: 'smooth' });
                });

                if (level === 1 || tocRoots.length === 0) {
                    tocRoots.push(tocItem);
                    currentTocItems = { [level]: tocItem };
                } else {
                    let parentLevel = level - 1;
                    while (parentLevel > 0 && !currentTocItems[parentLevel]) {
                        parentLevel--;
                    }
                    const parentTocItem = currentTocItems[parentLevel];
                    if (parentTocItem) {
                        let sublist = parentTocItem.querySelector('.page-toc-list');
                        if (!sublist) {
                            sublist = document.createElement('ul');
                            sublist.className = 'page-toc-list';
                            parentTocItem.appendChild(sublist);
                            parentTocItem.classList.add('collapsible');
                        }
                        sublist.appendChild(tocItem);
                    } else {
                        tocRoots.push(tocItem);
                    }
                    currentTocItems[level] = tocItem;
                }
            });

            tocRoots.forEach(item => list.appendChild(item));
        });
    }

    setupIntersectionObserver() {
      const options = {
        root: null,
        rootMargin: '0px 0px -50% 0px',
        threshold: 1.0
      };

      this.observer = new IntersectionObserver((entries) => {
        const intersectingHeadings = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => entry.target);

        if (intersectingHeadings.length > 0) {
          this.setActiveHeading(intersectingHeadings[intersectingHeadings.length - 1]);
        }
      }, options);

      this.headings.forEach(heading => this.observer.observe(heading));
    }

    setActiveHeading(heading) {
      if (heading === this.activeHeading) return;

      this.toc.querySelectorAll('.active').forEach(item => {
        item.classList.remove('active');
      });

      if (heading && heading.tocItem) {
        let current = heading.tocItem;
        while (current && current.classList.contains('page-toc-item')) {
          current.classList.add('active');
          if (current.classList.contains('collapsible')) {
            current.classList.remove('collapsed');
          }
          current = current.parentElement.closest('.page-toc-item');
        }
      }
      this.activeHeading = heading;
    }

    setupEventListeners() {
      const header = this.toc.querySelector('.page-toc-header');
      const resizeHandles = this.toc.querySelectorAll('.page-toc-resize');
      const levelSelect = this.toc.querySelector('.page-toc-level-select');
      const closeButton = this.toc.querySelector('.page-toc-close');
      const collapseAllButton = this.toc.querySelector('.page-toc-collapse-all');
      const expandAllButton = this.toc.querySelector('.page-toc-expand-all');
      const content = this.toc.querySelector('.page-toc-content');
      
      // 拖拽事件
      header.addEventListener('mousedown', (e) => {
        if (e.target === header) {
          this.isDragging = true;
          const rect = this.toc.getBoundingClientRect();
          this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
        }
      });

      // 调整大小事件
      resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
          this.isResizing = true;
          this.resizeDirection = handle.className.match(/page-toc-resize-([a-z]+)/)[1];
          
          const rect = this.toc.getBoundingClientRect();
          this.initialSize = {
            width: rect.width,
            height: rect.height
          };
          this.initialPosition = {
            x: rect.left,
            y: rect.top
          };
          
          e.preventDefault();
        });
      });

      // 级别选择事件
      levelSelect.addEventListener('change', (e) => {
        this.minLevel = parseInt(e.target.value);
        this.updateTOCContent(this.toc.querySelector('.page-toc-list'));
      });

      // 关闭按钮事件
      closeButton.addEventListener('click', () => {
        this.toggleVisibility();
      });

      // 折叠/展开事件
      collapseAllButton.addEventListener('click', () => {
        this.toc.querySelectorAll('.collapsible').forEach(item => {
          item.classList.add('collapsed');
        });
      });

      expandAllButton.addEventListener('click', () => {
        this.toc.querySelectorAll('.collapsible').forEach(item => {
          item.classList.remove('collapsed');
        });
      });

      content.addEventListener('click', (e) => {
        const item = e.target.closest('.collapsible');
        if (item && e.target.closest('.page-toc-item') === item) {
          item.classList.toggle('collapsed');
        }
      });

      // 全局鼠标事件
      document.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
          const x = e.clientX - this.dragOffset.x;
          const y = e.clientY - this.dragOffset.y;
          this.toc.style.left = `${x}px`;
          this.toc.style.top = `${y}px`;
        }
        
        if (this.isResizing) {
          const dx = e.clientX - (this.initialPosition.x + this.initialSize.width);
          const dy = e.clientY - (this.initialPosition.y + this.initialSize.height);
          
          let newWidth = this.initialSize.width;
          let newHeight = this.initialSize.height;
          let newX = this.initialPosition.x;
          let newY = this.initialPosition.y;

          // 根据调整方向处理大小和位置
          switch (this.resizeDirection) {
            case 'e':
              newWidth = this.initialSize.width + dx;
              break;
            case 'w':
              newWidth = this.initialSize.width - dx;
              newX = e.clientX;
              break;
            case 's':
              newHeight = this.initialSize.height + dy;
              break;
            case 'n':
              newHeight = this.initialSize.height - dy;
              newY = e.clientY;
              break;
            case 'se':
              newWidth = this.initialSize.width + dx;
              newHeight = this.initialSize.height + dy;
              break;
            case 'sw':
              newWidth = this.initialSize.width - dx;
              newHeight = this.initialSize.height + dy;
              newX = e.clientX;
              break;
            case 'ne':
              newWidth = this.initialSize.width + dx;
              newHeight = this.initialSize.height - dy;
              newY = e.clientY;
              break;
            case 'nw':
              newWidth = this.initialSize.width - dx;
              newHeight = this.initialSize.height - dy;
              newX = e.clientX;
              newY = e.clientY;
              break;
          }

          // 设置最小尺寸限制
          const minWidth = 200;
          const minHeight = 100;
          if (newWidth >= minWidth) {
            this.toc.style.width = `${newWidth}px`;
            if (['w', 'nw', 'sw'].includes(this.resizeDirection)) {
              this.toc.style.left = `${newX}px`;
            }
          }
          if (newHeight >= minHeight) {
            this.toc.style.height = `${newHeight}px`;
            if (['n', 'nw', 'ne'].includes(this.resizeDirection)) {
              this.toc.style.top = `${newY}px`;
            }
          }
        }
      });

      document.addEventListener('mouseup', () => {
        this.isDragging = false;
        this.isResizing = false;
      });

      // 主题切换事件
      const themeToggle = this.toc.querySelector('.page-toc-theme-toggle');
      themeToggle.addEventListener('click', () => {
        this.isDarkMode = !this.isDarkMode;
        themeToggle.innerHTML = this.isDarkMode ? ICONS.moon : ICONS.sun;
        this.applyTheme();
      });

      // 系统主题变化监听
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.isDarkMode = e.matches;
        themeToggle.innerHTML = this.isDarkMode ? ICONS.moon : ICONS.sun;
        this.applyTheme();
      });
    }
  }

  window.tocGenerator = new TOCGenerator();
  window.tocGenerator.init();
} else {
  window.tocGenerator.toggleVisibility();
}
