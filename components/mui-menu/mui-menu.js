/**
 * @file
 * MUI Menu component JavaScript for dropdown and context menu functionality.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Initialize MUI Menu functionality.
   */
  Drupal.behaviors.muiMenu = {
    attach: function (context, settings) {
      const menus = once('mui-menu', '.MuiMenu-root', context);
      
      menus.forEach(function (menu) {
        new MuiMenu(menu);
      });
    }
  };

  /**
   * MUI Menu class.
   */
  function MuiMenu(element) {
    this.element = element;
    this.menuList = element.querySelector('.MuiMenu-list');
    this.searchInput = element.querySelector('.MuiMenu-searchInput');
    this.menuItems = element.querySelectorAll('.MuiMenuItem-root');
    this.submenuItems = element.querySelectorAll('.MuiMenuItem-hasSubmenu');
    
    this.isOpen = element.classList.contains('is-open');
    this.contextMenu = element.classList.contains('MuiMenu-context');
    this.autoFocus = element.dataset.autoFocus !== 'false';
    this.currentFocusIndex = -1;
    this.focusableItems = [];
    
    this.init();
  }

  MuiMenu.prototype = {
    
    /**
     * Initialize menu functionality.
     */
    init: function () {
      this.updateFocusableItems();
      this.bindEvents();
      
      // Store instance on element
      this.element.muiMenu = this;
      
      // Initialize search if enabled
      if (this.searchInput) {
        this.initializeSearch();
      }
      
      // Initialize submenus
      this.initializeSubmenus();
      
      // Handle initial focus if menu is open
      if (this.isOpen && this.autoFocus) {
        this.focusFirstItem();
      }
    },

    /**
     * Bind event listeners.
     */
    bindEvents: function () {
      const self = this;
      
      // Global click handler for closing menu
      document.addEventListener('click', function (e) {
        if (!self.element.contains(e.target)) {
          self.close();
        }
      });
      
      // Keyboard navigation
      this.element.addEventListener('keydown', function (e) {
        self.handleKeydown(e);
      });
      
      // Menu item clicks
      this.menuItems.forEach(function (item, index) {
        item.addEventListener('click', function (e) {
          self.handleItemClick(e, item, index);
        });
        
        item.addEventListener('mouseenter', function () {
          self.focusItem(index);
        });
      });
      
      // Backdrop click for context menus
      if (this.contextMenu) {
        const backdrop = this.element.querySelector('.MuiMenu-backdrop');
        if (backdrop) {
          backdrop.addEventListener('click', function () {
            self.close();
          });
        }
      }
    },

    /**
     * Initialize search functionality.
     */
    initializeSearch: function () {
      const self = this;
      let searchTimeout;
      
      this.searchInput.addEventListener('input', function (e) {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Debounce search
        searchTimeout = setTimeout(() => {
          self.performSearch(searchTerm);
        }, 300);
      });
      
      // Handle search keyboard events
      this.searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          e.target.value = '';
          self.performSearch('');
          self.focusFirstItem();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          self.focusFirstItem();
        }
      });
    },

    /**
     * Perform search filtering.
     */
    performSearch: function (searchTerm) {
      let visibleCount = 0;
      
      this.menuItems.forEach(function (item) {
        const text = item.textContent.toLowerCase();
        const isVisible = !searchTerm || text.includes(searchTerm);
        
        item.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
      });
      
      this.updateFocusableItems();
      
      // Dispatch search event
      this.element.dispatchEvent(new CustomEvent('mui:menu:search', {
        bubbles: true,
        detail: { 
          searchTerm, 
          visibleCount,
          totalCount: this.menuItems.length 
        }
      }));
    },

    /**
     * Initialize submenu functionality.
     */
    initializeSubmenus: function () {
      const self = this;
      
      this.submenuItems.forEach(function (item) {
        const submenu = item.querySelector('.MuiMenu-submenu');
        if (!submenu) return;
        
        let submenuTimeout;
        
        item.addEventListener('mouseenter', function () {
          clearTimeout(submenuTimeout);
          self.showSubmenu(submenu);
        });
        
        item.addEventListener('mouseleave', function () {
          submenuTimeout = setTimeout(() => {
            self.hideSubmenu(submenu);
          }, 300);
        });
        
        // Keep submenu open when hovering over it
        submenu.addEventListener('mouseenter', function () {
          clearTimeout(submenuTimeout);
        });
        
        submenu.addEventListener('mouseleave', function () {
          submenuTimeout = setTimeout(() => {
            self.hideSubmenu(submenu);
          }, 300);
        });
      });
    },

    /**
     * Show submenu.
     */
    showSubmenu: function (submenu) {
      // Position submenu
      this.positionSubmenu(submenu);
      
      // Show with animation
      submenu.style.opacity = '1';
      submenu.style.visibility = 'visible';
      submenu.style.transform = 'scale(1)';
    },

    /**
     * Hide submenu.
     */
    hideSubmenu: function (submenu) {
      submenu.style.opacity = '0';
      submenu.style.visibility = 'hidden';
      submenu.style.transform = 'scale(0.9)';
    },

    /**
     * Position submenu relative to viewport.
     */
    positionSubmenu: function (submenu) {
      const parentRect = submenu.parentElement.getBoundingClientRect();
      const submenuRect = submenu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if submenu fits to the right
      if (parentRect.right + submenuRect.width > viewportWidth) {
        submenu.classList.add('align-right');
      } else {
        submenu.classList.remove('align-right');
      }
      
      // Adjust vertical position if needed
      if (parentRect.top + submenuRect.height > viewportHeight) {
        const topOffset = Math.max(0, viewportHeight - submenuRect.height - 16);
        submenu.style.top = `${topOffset - parentRect.top}px`;
      } else {
        submenu.style.top = '0';
      }
    },

    /**
     * Handle keyboard navigation.
     */
    handleKeydown: function (e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.focusNextItem();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          this.focusPreviousItem();
          break;
          
        case 'Home':
          e.preventDefault();
          this.focusFirstItem();
          break;
          
        case 'End':
          e.preventDefault();
          this.focusLastItem();
          break;
          
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.activateCurrentItem();
          break;
          
        case 'Escape':
          e.preventDefault();
          this.close();
          break;
          
        case 'Tab':
          // Allow tab to close menu
          this.close();
          break;
      }
    },

    /**
     * Handle menu item clicks.
     */
    handleItemClick: function (e, item, index) {
      // Don't handle clicks on disabled items
      if (item.classList.contains('Mui-disabled')) {
        e.preventDefault();
        return;
      }
      
      // Handle different item types
      const checkbox = item.querySelector('.MuiCheckbox-input');
      const radio = item.querySelector('.MuiRadio-input');
      
      if (checkbox) {
        this.handleCheckboxClick(checkbox, item);
      } else if (radio) {
        this.handleRadioClick(radio, item);
      } else {
        this.handleRegularItemClick(e, item, index);
      }
    },

    /**
     * Handle checkbox item clicks.
     */
    handleCheckboxClick: function (checkbox, item) {
      checkbox.checked = !checkbox.checked;
      
      // Dispatch event
      this.element.dispatchEvent(new CustomEvent('mui:menu:checkbox:changed', {
        bubbles: true,
        detail: { 
          checkbox,
          checked: checkbox.checked,
          item
        }
      }));
    },

    /**
     * Handle radio item clicks.
     */
    handleRadioClick: function (radio, item) {
      // Uncheck other radios in the same group
      const groupName = radio.name;
      if (groupName) {
        const otherRadios = this.element.querySelectorAll(`input[name="${groupName}"]`);
        otherRadios.forEach(function (otherRadio) {
          otherRadio.checked = false;
        });
      }
      
      radio.checked = true;
      
      // Dispatch event
      this.element.dispatchEvent(new CustomEvent('mui:menu:radio:changed', {
        bubbles: true,
        detail: { 
          radio,
          item
        }
      }));
    },

    /**
     * Handle regular item clicks.
     */
    handleRegularItemClick: function (e, item, index) {
      // Check for custom click handler
      const clickHandler = item.dataset.click;
      if (clickHandler && typeof window[clickHandler] === 'function') {
        const result = window[clickHandler].call(item, e, this);
        if (result === false) return;
      }
      
      // Mark item as selected if it's a selectable menu
      if (this.element.classList.contains('MuiMenu-selectedMenu')) {
        this.selectItem(item);
      }
      
      // Dispatch selection event
      this.element.dispatchEvent(new CustomEvent('mui:menu:item:selected', {
        bubbles: true,
        detail: { 
          item,
          index,
          text: item.textContent.trim()
        }
      }));
      
      // Close menu after selection (unless it has submenus)
      if (!item.classList.contains('MuiMenuItem-hasSubmenu')) {
        setTimeout(() => this.close(), 150);
      }
    },

    /**
     * Select a menu item.
     */
    selectItem: function (item) {
      // Remove selection from other items
      this.menuItems.forEach(function (menuItem) {
        menuItem.classList.remove('Mui-selected');
      });
      
      // Add selection to current item
      item.classList.add('Mui-selected');
    },

    /**
     * Update focusable items list.
     */
    updateFocusableItems: function () {
      this.focusableItems = Array.from(this.menuItems).filter(function (item) {
        return item.style.display !== 'none' && !item.classList.contains('Mui-disabled');
      });
    },

    /**
     * Focus management methods.
     */
    focusFirstItem: function () {
      this.currentFocusIndex = 0;
      this.focusCurrentItem();
    },

    focusLastItem: function () {
      this.currentFocusIndex = this.focusableItems.length - 1;
      this.focusCurrentItem();
    },

    focusNextItem: function () {
      this.currentFocusIndex = Math.min(this.currentFocusIndex + 1, this.focusableItems.length - 1);
      this.focusCurrentItem();
    },

    focusPreviousItem: function () {
      this.currentFocusIndex = Math.max(this.currentFocusIndex - 1, 0);
      this.focusCurrentItem();
    },

    focusItem: function (index) {
      this.currentFocusIndex = index;
      this.focusCurrentItem();
    },

    focusCurrentItem: function () {
      if (this.focusableItems[this.currentFocusIndex]) {
        this.focusableItems[this.currentFocusIndex].focus();
      }
    },

    activateCurrentItem: function () {
      if (this.focusableItems[this.currentFocusIndex]) {
        this.focusableItems[this.currentFocusIndex].click();
      }
    },

    /**
     * Open the menu.
     */
    open: function (anchorElement) {
      if (this.isOpen) return;
      
      this.isOpen = true;
      this.element.classList.add('is-open');
      
      // Position menu relative to anchor
      if (anchorElement) {
        this.positionMenu(anchorElement);
      }
      
      // Focus management
      if (this.autoFocus) {
        setTimeout(() => {
          if (this.searchInput) {
            this.searchInput.focus();
          } else {
            this.focusFirstItem();
          }
        }, 100);
      }
      
      // Dispatch open event
      this.element.dispatchEvent(new CustomEvent('mui:menu:open', {
        bubbles: true,
        detail: { menu: this }
      }));
    },

    /**
     * Close the menu.
     */
    close: function () {
      if (!this.isOpen) return;
      
      this.isOpen = false;
      this.element.classList.remove('is-open');
      
      // Hide all submenus
      const submenus = this.element.querySelectorAll('.MuiMenu-submenu');
      submenus.forEach(submenu => this.hideSubmenu(submenu));
      
      // Clear search if enabled
      if (this.searchInput) {
        this.searchInput.value = '';
        this.performSearch('');
      }
      
      // Call external close handler
      const closeHandler = this.element.dataset.onClose;
      if (closeHandler && typeof window[closeHandler] === 'function') {
        window[closeHandler].call(this.element, this);
      }
      
      // Dispatch close event
      this.element.dispatchEvent(new CustomEvent('mui:menu:close', {
        bubbles: true,
        detail: { menu: this }
      }));
    },

    /**
     * Position menu relative to anchor element.
     */
    positionMenu: function (anchorElement) {
      const anchorRect = anchorElement.getBoundingClientRect();
      const menuPaper = this.element.querySelector('.MuiMenu-paper');
      
      if (!menuPaper) return;
      
      // Basic positioning (can be enhanced based on anchor/transform origins)
      menuPaper.style.top = `${anchorRect.bottom + 4}px`;
      menuPaper.style.left = `${anchorRect.left}px`;
      
      // Adjust if menu would overflow viewport
      const menuRect = menuPaper.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Horizontal overflow
      if (menuRect.right > viewportWidth) {
        menuPaper.style.left = `${viewportWidth - menuRect.width - 16}px`;
      }
      
      // Vertical overflow
      if (menuRect.bottom > viewportHeight) {
        menuPaper.style.top = `${anchorRect.top - menuRect.height - 4}px`;
      }
    },

    /**
     * Toggle menu open/closed.
     */
    toggle: function (anchorElement) {
      if (this.isOpen) {
        this.close();
      } else {
        this.open(anchorElement);
      }
    },

    /**
     * Destroy menu instance.
     */
    destroy: function () {
      // Remove instance reference
      delete this.element.muiMenu;
    }
  };

  /**
   * Utility functions for creating menus programmatically.
   */
  Drupal.muiMenu = {
    
    /**
     * Create a new menu instance.
     */
    create: function (items, options = {}) {
      const defaults = {
        elevation: 8,
        dense: false,
        searchable: false,
        contextMenu: false
      };
      
      const settings = Object.assign({}, defaults, options);
      
      // Create menu element
      const menuElement = document.createElement('div');
      menuElement.className = `MuiMenu-root MuiMenu-elevation${settings.elevation}`;
      
      if (settings.dense) {
        menuElement.classList.add('MuiMenu-dense');
      }
      
      if (settings.contextMenu) {
        menuElement.classList.add('MuiMenu-context');
      }
      
      // Build menu structure
      let menuHTML = '<div class="MuiMenu-paper"><div class="MuiMenu-backdrop"></div>';
      
      if (settings.searchable) {
        menuHTML += '<div class="MuiMenu-search"><input type="text" class="MuiMenu-searchInput" placeholder="Search..." /></div>';
      }
      
      menuHTML += '<ul class="MuiMenu-list" role="menu">';
      
      items.forEach(function (item) {
        menuHTML += buildMenuItem(item);
      });
      
      menuHTML += '</ul></div>';
      menuElement.innerHTML = menuHTML;
      
      // Initialize the menu
      const menuInstance = new MuiMenu(menuElement);
      
      return {
        element: menuElement,
        instance: menuInstance,
        open: function (anchor) {
          if (!menuElement.parentNode) {
            document.body.appendChild(menuElement);
          }
          menuInstance.open(anchor);
          return this;
        },
        close: function () {
          menuInstance.close();
          return this;
        }
      };
    },
    
    /**
     * Get menu instance from element.
     */
    getInstance: function (element) {
      const menu = element.closest('.MuiMenu-root');
      return menu ? menu.muiMenu : null;
    }
  };

  /**
   * Helper function to build menu item HTML.
   */
  function buildMenuItem(item) {
    let html = '<li class="MuiMenuItem-root';
    
    if (item.disabled) html += ' Mui-disabled';
    if (item.selected) html += ' Mui-selected';
    if (item.submenu) html += ' MuiMenuItem-hasSubmenu';
    
    html += '"';
    
    if (item.url) {
      html += ` href="${item.url}"`;
      if (item.target) html += ` target="${item.target}"`;
    }
    
    html += '>';
    
    // Icon
    if (item.icon) {
      html += `<div class="MuiMenuItem-icon">${item.icon}</div>`;
    }
    
    // Content
    html += '<div class="MuiMenuItem-content">';
    html += `<div class="MuiMenuItem-primary">${item.text}</div>`;
    if (item.secondary) {
      html += `<div class="MuiMenuItem-secondary">${item.secondary}</div>`;
    }
    html += '</div>';
    
    // Shortcut
    if (item.shortcut) {
      html += `<div class="MuiMenuItem-shortcut">${item.shortcut}</div>`;
    }
    
    html += '</li>';
    
    return html;
  }

})(Drupal, once);