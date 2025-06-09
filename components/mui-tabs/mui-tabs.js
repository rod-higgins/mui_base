/**
 * @file
 * MUI Tabs component JavaScript for interactive functionality.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Initialize MUI Tabs functionality.
   */
  Drupal.behaviors.muiTabs = {
    attach: function (context, settings) {
      const tabContainers = once('mui-tabs', '.MuiTabs-root', context);
      
      tabContainers.forEach(function (container) {
        new MuiTabs(container);
      });
    }
  };

  /**
   * MUI Tabs class.
   */
  function MuiTabs(element) {
    this.element = element;
    this.tabList = element.querySelector('[role="tablist"]');
    this.tabs = Array.from(element.querySelectorAll('[role="tab"]'));
    this.panels = Array.from(element.querySelectorAll('[role="tabpanel"]'));
    this.indicator = element.querySelector('.MuiTabs-indicator');
    this.scroller = element.querySelector('.MuiTabs-scroller');
    this.scrollLeftButton = element.querySelector('.MuiTabs-scrollButtonLeft');
    this.scrollRightButton = element.querySelector('.MuiTabs-scrollButtonRight');
    this.addButton = element.querySelector('[data-action="add-tab"]');
    
    this.currentTab = parseInt(element.dataset.defaultTab) || 0;
    this.transitionDuration = parseInt(element.dataset.transitionDuration) || 300;
    this.lazyLoad = element.dataset.lazyLoad === 'true';
    this.keepMounted = element.dataset.keepMounted === 'true';
    this.isVertical = element.classList.contains('MuiTabs-vertical');
    this.isScrollable = element.classList.contains('MuiTabs-scrollable');
    this.isNavigation = element.classList.contains('MuiTabs-navigation');
    this.isReorderable = element.classList.contains('MuiTabs-reorderable');
    
    this.scrollObserver = null;
    this.resizeObserver = null;
    
    this.init();
  }

  MuiTabs.prototype = {
    
    /**
     * Initialize tabs functionality.
     */
    init: function () {
      this.bindEvents();
      this.setupScrolling();
      this.setupReordering();
      this.updateIndicator();
      this.updatePanels();
      this.checkScrollButtons();
      
      // Store instance on element
      this.element.muiTabs = this;
      
      // Set initial active tab
      if (this.tabs[this.currentTab]) {
        this.setActiveTab(this.currentTab, false);
      }
    },

    /**
     * Bind event listeners.
     */
    bindEvents: function () {
      const self = this;
      
      // Tab clicks
      this.tabs.forEach(function (tab, index) {
        if (!self.isNavigation) {
          tab.addEventListener('click', function (e) {
            e.preventDefault();
            if (!tab.disabled) {
              self.setActiveTab(index);
            }
          });
        }
        
        // Close button clicks
        const closeButton = tab.querySelector('[data-action="close-tab"]');
        if (closeButton) {
          closeButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.closeTab(parseInt(closeButton.dataset.tabIndex));
          });
        }
      });
      
      // Keyboard navigation
      this.tabList.addEventListener('keydown', function (e) {
        self.handleKeydown(e);
      });
      
      // Add button
      if (this.addButton) {
        this.addButton.addEventListener('click', function (e) {
          e.preventDefault();
          self.addTab();
        });
      }
      
      // Scroll buttons
      if (this.scrollLeftButton) {
        this.scrollLeftButton.addEventListener('click', function () {
          self.scrollTabs('left');
        });
      }
      
      if (this.scrollRightButton) {
        this.scrollRightButton.addEventListener('click', function () {
          self.scrollTabs('right');
        });
      }
      
      // Window resize
      window.addEventListener('resize', function () {
        self.checkScrollButtons();
        self.updateIndicator();
      });
      
      // Scroll events for scroll buttons
      if (this.scroller) {
        this.scroller.addEventListener('scroll', function () {
          self.checkScrollButtons();
        });
      }
    },

    /**
     * Set active tab.
     */
    setActiveTab: function (index, animate = true) {
      if (index < 0 || index >= this.tabs.length) return;
      if (this.tabs[index].disabled) return;
      
      const previousTab = this.currentTab;
      this.currentTab = index;
      
      // Update tab attributes
      this.tabs.forEach(function (tab, i) {
        const isActive = i === index;
        tab.setAttribute('aria-selected', isActive.toString());
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
        
        if (isActive) {
          tab.classList.add('Mui-selected');
          tab.focus();
        } else {
          tab.classList.remove('Mui-selected');
        }
      });
      
      // Update indicator
      if (animate) {
        setTimeout(() => this.updateIndicator(), 10);
      } else {
        this.updateIndicator();
      }
      
      // Update panels
      this.updatePanels();
      
      // Scroll active tab into view
      this.scrollTabIntoView(index);
      
      // Dispatch change event
      this.element.dispatchEvent(new CustomEvent('mui:tabs:change', {
        bubbles: true,
        detail: { 
          activeTab: index, 
          previousTab: previousTab,
          tab: this.tabs[index],
          panel: this.panels[index]
        }
      }));
      
      // Call external handler
      const changeHandler = this.element.dataset.onChange;
      if (changeHandler && typeof window[changeHandler] === 'function') {
        window[changeHandler].call(this.element, {
          activeTab: index,
          previousTab: previousTab,
          tab: this.tabs[index],
          panel: this.panels[index]
        });
      }
    },

    /**
     * Update indicator position.
     */
    updateIndicator: function () {
      if (!this.indicator || !this.tabs[this.currentTab]) return;
      
      const activeTab = this.tabs[this.currentTab];
      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = this.tabList.getBoundingClientRect();
      
      if (this.isVertical) {
        const top = tabRect.top - containerRect.top;
        const height = tabRect.height;
        
        this.indicator.style.top = top + 'px';
        this.indicator.style.height = height + 'px';
        this.indicator.style.left = '';
        this.indicator.style.width = '';
      } else {
        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;
        
        this.indicator.style.left = left + 'px';
        this.indicator.style.width = width + 'px';
        this.indicator.style.top = '';
        this.indicator.style.height = '';
      }
    },

    /**
     * Update panel visibility.
     */
    updatePanels: function () {
      if (this.isNavigation) return;
      
      const self = this;
      
      this.panels.forEach(function (panel, index) {
        const isActive = index === self.currentTab;
        
        if (isActive) {
          panel.classList.add('MuiTabPanel-active');
          panel.classList.remove('MuiTabPanel-hidden');
          panel.removeAttribute('hidden');
          
          // Lazy load content if needed
          if (self.lazyLoad && !panel.dataset.loaded) {
            self.loadPanelContent(panel);
          }
        } else {
          panel.classList.remove('MuiTabPanel-active');
          panel.classList.add('MuiTabPanel-hidden');
          
          if (!self.keepMounted) {
            panel.setAttribute('hidden', '');
          }
        }
      });
    },

    /**
     * Load panel content (for lazy loading).
     */
    loadPanelContent: function (panel) {
      // Mark as loaded
      panel.dataset.loaded = 'true';
      
      // Dispatch load event for custom loading logic
      panel.dispatchEvent(new CustomEvent('mui:tabpanel:load', {
        bubbles: true,
        detail: { panel: panel }
      }));
    },

    /**
     * Handle keyboard navigation.
     */
    handleKeydown: function (e) {
      const currentIndex = this.tabs.indexOf(e.target);
      if (currentIndex === -1) return;
      
      let newIndex = currentIndex;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (!this.isVertical) {
            e.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
          }
          break;
          
        case 'ArrowRight':
          if (!this.isVertical) {
            e.preventDefault();
            newIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
          }
          break;
          
        case 'ArrowUp':
          if (this.isVertical) {
            e.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
          }
          break;
          
        case 'ArrowDown':
          if (this.isVertical) {
            e.preventDefault();
            newIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
          }
          break;
          
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
          
        case 'End':
          e.preventDefault();
          newIndex = this.tabs.length - 1;
          break;
          
        case 'Enter':
        case ' ':
          if (!this.isNavigation) {
            e.preventDefault();
            this.setActiveTab(currentIndex);
          }
          break;
      }
      
      // Find next non-disabled tab
      while (this.tabs[newIndex] && this.tabs[newIndex].disabled) {
        if (newIndex > currentIndex) {
          newIndex = newIndex < this.tabs.length - 1 ? newIndex + 1 : 0;
        } else {
          newIndex = newIndex > 0 ? newIndex - 1 : this.tabs.length - 1;
        }
        
        // Prevent infinite loop
        if (newIndex === currentIndex) break;
      }
      
      if (newIndex !== currentIndex && this.tabs[newIndex]) {
        this.tabs[newIndex].focus();
      }
    },

    /**
     * Setup scrolling functionality.
     */
    setupScrolling: function () {
      if (!this.isScrollable) return;
      
      const self = this;
      
      // Create intersection observer for scroll detection
      if ('IntersectionObserver' in window) {
        this.scrollObserver = new IntersectionObserver(function (entries) {
          self.checkScrollButtons();
        }, {
          root: this.scroller,
          threshold: 1.0
        });
        
        this.tabs.forEach(function (tab) {
          self.scrollObserver.observe(tab);
        });
      }
      
      // Touch/mouse wheel scrolling
      this.scroller.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          self.scroller.scrollLeft += e.deltaX;
        }
      });
    },

    /**
     * Check and update scroll button states.
     */
    checkScrollButtons: function () {
      if (!this.isScrollable || !this.scroller) return;
      
      const isAtStart = this.scroller.scrollLeft <= 0;
      const isAtEnd = this.scroller.scrollLeft >= 
        this.scroller.scrollWidth - this.scroller.clientWidth - 1;
      
      if (this.scrollLeftButton) {
        this.scrollLeftButton.disabled = isAtStart;
        this.scrollLeftButton.style.display = 
          this.element.dataset.scrollButtons === 'off' ? 'none' : 
          (this.element.dataset.scrollButtons === 'on' || !isAtStart) ? 'flex' : 'none';
      }
      
      if (this.scrollRightButton) {
        this.scrollRightButton.disabled = isAtEnd;
        this.scrollRightButton.style.display = 
          this.element.dataset.scrollButtons === 'off' ? 'none' : 
          (this.element.dataset.scrollButtons === 'on' || !isAtEnd) ? 'flex' : 'none';
      }
    },

    /**
     * Scroll tabs left or right.
     */
    scrollTabs: function (direction) {
      if (!this.scroller) return;
      
      const scrollAmount = this.scroller.clientWidth * 0.8;
      const currentScroll = this.scroller.scrollLeft;
      const newScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;
      
      this.scroller.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    },

    /**
     * Scroll active tab into view.
     */
    scrollTabIntoView: function (index) {
      if (!this.isScrollable || !this.scroller) return;
      
      const tab = this.tabs[index];
      if (!tab) return;
      
      const tabRect = tab.getBoundingClientRect();
      const scrollerRect = this.scroller.getBoundingClientRect();
      
      if (tabRect.left < scrollerRect.left) {
        // Tab is to the left, scroll left
        this.scroller.scrollLeft -= scrollerRect.left - tabRect.left + 24;
      } else if (tabRect.right > scrollerRect.right) {
        // Tab is to the right, scroll right
        this.scroller.scrollLeft += tabRect.right - scrollerRect.right + 24;
      }
    },

    /**
     * Close a tab.
     */
    closeTab: function (index) {
      if (index < 0 || index >= this.tabs.length) return;
      
      const tab = this.tabs[index];
      const panel = this.panels[index];
      
      // Dispatch close event
      const closeEvent = new CustomEvent('mui:tabs:close', {
        bubbles: true,
        cancelable: true,
        detail: { 
          index: index,
          tab: tab,
          panel: panel
        }
      });
      
      this.element.dispatchEvent(closeEvent);
      
      if (closeEvent.defaultPrevented) return;
      
      // Call external handler
      const closeHandler = this.element.dataset.onClose;
      if (closeHandler && typeof window[closeHandler] === 'function') {
        const result = window[closeHandler].call(this.element, {
          index: index,
          tab: tab,
          panel: panel
        });
        
        if (result === false) return;
      }
      
      // Remove tab and panel
      if (tab) tab.remove();
      if (panel) panel.remove();
      
      // Update arrays
      this.tabs.splice(index, 1);
      if (panel) {
        this.panels.splice(index, 1);
      }
      
      // Adjust current tab if necessary
      if (index === this.currentTab) {
        // Set to previous tab, or first tab if this was the first
        const newIndex = Math.max(0, Math.min(index - 1, this.tabs.length - 1));
        if (this.tabs.length > 0) {
          this.setActiveTab(newIndex);
        }
      } else if (index < this.currentTab) {
        this.currentTab--;
      }
      
      this.updateIndicator();
      this.checkScrollButtons();
    },

    /**
     * Add a new tab.
     */
    addTab: function (config = {}) {
      // Dispatch add event
      const addEvent = new CustomEvent('mui:tabs:add', {
        bubbles: true,
        cancelable: true,
        detail: { config: config }
      });
      
      this.element.dispatchEvent(addEvent);
      
      if (addEvent.defaultPrevented) return;
      
      // Call external handler
      const addHandler = this.element.dataset.onAdd;
      if (addHandler && typeof window[addHandler] === 'function') {
        window[addHandler].call(this.element, { config: config });
      }
    },

    /**
     * Setup drag and drop reordering.
     */
    setupReordering: function () {
      if (!this.isReorderable) return;
      
      const self = this;
      let draggedTab = null;
      let draggedIndex = -1;
      
      this.tabs.forEach(function (tab, index) {
        tab.draggable = true;
        
        tab.addEventListener('dragstart', function (e) {
          draggedTab = tab;
          draggedIndex = index;
          tab.classList.add('is-dragging');
          
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/html', tab.outerHTML);
        });
        
        tab.addEventListener('dragend', function () {
          tab.classList.remove('is-dragging');
          draggedTab = null;
          draggedIndex = -1;
        });
        
        tab.addEventListener('dragover', function (e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });
        
        tab.addEventListener('drop', function (e) {
          e.preventDefault();
          
          if (draggedTab && draggedIndex !== index) {
            self.reorderTab(draggedIndex, index);
          }
        });
      });
    },

    /**
     * Reorder tabs.
     */
    reorderTab: function (fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      
      // Move tab element
      const tab = this.tabs[fromIndex];
      const targetTab = this.tabs[toIndex];
      
      if (fromIndex < toIndex) {
        targetTab.parentNode.insertBefore(tab, targetTab.nextSibling);
      } else {
        targetTab.parentNode.insertBefore(tab, targetTab);
      }
      
      // Update arrays
      const movedTab = this.tabs.splice(fromIndex, 1)[0];
      this.tabs.splice(toIndex, 0, movedTab);
      
      if (this.panels.length > 0) {
        const movedPanel = this.panels.splice(fromIndex, 1)[0];
        this.panels.splice(toIndex, 0, movedPanel);
      }
      
      // Update current tab index
      if (this.currentTab === fromIndex) {
        this.currentTab = toIndex;
      } else if (fromIndex < this.currentTab && toIndex >= this.currentTab) {
        this.currentTab--;
      } else if (fromIndex > this.currentTab && toIndex <= this.currentTab) {
        this.currentTab++;
      }
      
      this.updateIndicator();
      
      // Dispatch reorder event
      this.element.dispatchEvent(new CustomEvent('mui:tabs:reorder', {
        bubbles: true,
        detail: { 
          fromIndex: fromIndex,
          toIndex: toIndex,
          tab: movedTab
        }
      }));
    },

    /**
     * Get current active tab index.
     */
    getActiveTab: function () {
      return this.currentTab;
    },

    /**
     * Get tab count.
     */
    getTabCount: function () {
      return this.tabs.length;
    },

    /**
     * Destroy tabs instance.
     */
    destroy: function () {
      if (this.scrollObserver) {
        this.scrollObserver.disconnect();
      }
      
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      
      // Remove instance reference
      delete this.element.muiTabs;
    }
  };

  /**
   * Utility functions for working with tabs.
   */
  Drupal.muiTabs = {
    
    /**
     * Get tabs instance from element.
     */
    getInstance: function (element) {
      const tabs = element.closest('.MuiTabs-root');
      return tabs ? tabs.muiTabs : null;
    },
    
    /**
     * Create tabs programmatically.
     */
    create: function (container, options = {}) {
      // Implementation would depend on integration requirements
      console.log('Creating tabs with options:', options);
      
      // Initialize existing tabs
      if (container.classList.contains('MuiTabs-root')) {
        return new MuiTabs(container);
      }
      
      return null;
    }
  };

})(Drupal, once);