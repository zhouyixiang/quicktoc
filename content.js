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
    }

    init() {
      this.generateTOC();
      this.setupEventListeners();
    }

    generateTOC() {
      // 获取所有标题元素
      this.headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      if (this.headings.length === 0) return;

      // 创建TOC容器
      this.toc = document.createElement('div');
      this.toc.className = 'page-toc';
      
      // 创建TOC头部
      const header = document.createElement('div');
      header.className = 'page-toc-header';
      
      const title = document.createElement('span');
      title.className = 'page-toc-title';
      title.textContent = t('title');
      
      const controls = document.createElement('div');
      controls.className = 'page-toc-controls';
      
      // 创建主题切换按钮
      const themeToggle = document.createElement('button');
      themeToggle.className = 'page-toc-theme-toggle';
      themeToggle.innerHTML = this.isDarkMode ? t('lightMode') : t('darkMode');
      
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

      // 设置初始主题
      if (this.isDarkMode) {
        this.toc.classList.add('dark-mode');
      }
    }

    updateTOCContent(list) {
      chrome.storage.sync.get({hideSingleH1: true}, (items) => {
        list.innerHTML = '';
        const h1s = this.headings.filter(h => h.tagName === 'H1');
        const hideSingleH1 = items.hideSingleH1 && h1s.length === 1;

        this.headings.forEach(heading => {
          if (hideSingleH1 && heading.tagName === 'H1') {
            return;
          }
          const level = parseInt(heading.tagName[1]);
          if (level <= this.minLevel) {
            const item = document.createElement('li');
            item.className = `page-toc-item page-toc-h${level}`;
            item.textContent = heading.textContent;
            item.addEventListener('click', () => {
              heading.scrollIntoView({ behavior: 'smooth' });
            });
            list.appendChild(item);
          }
        });
      });
    }

    setupEventListeners() {
      const header = this.toc.querySelector('.page-toc-header');
      const resizeHandles = this.toc.querySelectorAll('.page-toc-resize');
      const levelSelect = this.toc.querySelector('.page-toc-level-select');
      const closeButton = this.toc.querySelector('.page-toc-close');
      
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
        this.toc.remove();
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
        this.toc.classList.toggle('dark-mode');
        themeToggle.innerHTML = this.isDarkMode ? t('lightMode') : t('darkMode');
      });

      // 系统主题变化监听
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.isDarkMode = e.matches;
        this.toc.classList.toggle('dark-mode', this.isDarkMode);
        themeToggle.innerHTML = this.isDarkMode ? t('lightMode') : t('darkMode');
      });
    }
  }

  window.tocGenerator = new TOCGenerator();
  window.tocGenerator.init();
} else {
  // 如果TOC已经存在但被关闭了，重新初始化
  if (!document.querySelector('.page-toc')) {
    window.tocGenerator.init();
  }
} 