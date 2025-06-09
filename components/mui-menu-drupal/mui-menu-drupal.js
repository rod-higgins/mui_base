/**
 * @file
 * MUI Menu Drupal Integration JavaScript.
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * Initialize MUI Menu Drupal integration functionality.
   */
  Drupal.behaviors.muiMenuDrupal = {
    attach: function (context, settings) {
      const drupalMenus = once('mui-menu-drupal', '.mui-menu-drupal', context);
      
      drupalMenus.forEach(function (menu) {
        new MuiMenuDrupal(menu);
      });
    }
  };

  /**
   * MUI Menu Drupal class for enhanced Drupal integration.
   */
  function MuiMenuDrupal(element) {
    this.element = element;
    this.menuName = element.dataset.menuName;
    this.muiMenu = element.querySelector('.MuiMenu-root');
    this.muiMenuInstance = this.muiMenu ? this.muiMenu.muiMenu : null;
    
    this.init();
  }

  MuiMenuDrupal.prototype = {
    
    /**
     * Initialize Drupal-specific functionality.
     */
    init: function () {
      this.bindDrupalEvents();
      this.setupActiveTrailHandling();
      this.setupAjaxIntegration();
      
      // Store instance on element
      this.element.muiMenuDrupal = this;
    },

    /**
     * Bind Drupal-specific events.
     */
    bindDrupalEvents: function () {
      const self = this;
      
      // Handle Drupal menu item clicks for analytics/tracking
      this.element.addEventListener('mui:menu:item:selected', function (e) {
        const item = e.detail.item;
        const url = item.getAttribute('href');
        
        if (url) {
          // Trigger Drupal behaviors for menu tracking
          Drupal.announce(Drupal.t('Navigating to @title', {
            '@title': e.detail.text
          }));
          
          // Custom menu selection event for modules to listen to
          const drupalEvent = new CustomEvent('drupal:menu:selection', {
            bubbles: true,
            detail: {
              menuName: self.menuName,
              itemText: e.detail.text,
              itemUrl: url,
              element: item
            }
          });
          document.dispatchEvent(drupalEvent);
        }
      });
      
      // Handle external link warnings
      this.element.addEventListener('click', function (e) {
        const link = e.target.closest('a[target="_blank"]');
        if (link && drupalSettings.muiMenuDrupal?.warnExternalLinks) {
          const confirmed = confirm(Drupal.t('This link will open in a new window. Continue?'));
          if (!confirmed) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      });
    },

    /**
     * Setup active trail handling for dynamic content.
     */
    setupActiveTrailHandling: function () {
      const self = this;
      
      // Listen for URL changes (for SPA-like behavior)
      if (window.history && window.history.pushState) {
        window.addEventListener('popstate', function () {
          self.updateActiveTrail();
        });
      }
      
      // Update active trail on AJAX requests
      document.addEventListener('drupal:ajax:complete', function () {
        self.updateActiveTrail();
      });
    },

    /**
     * Update active trail based on current URL.
     */
    updateActiveTrail: function () {
      const currentPath = window.location.pathname;
      const menuItems = this.element.querySelectorAll('.MuiMenuItem-root[href]');
      
      menuItems.forEach(function (item) {
        const itemPath = new URL(item.href, window.location.origin).pathname;
        
        // Remove existing active trail classes
        item.classList.remove('Mui-selected', 'in-active-trail');
        
        // Add active trail if paths match
        if (itemPath === currentPath) {
          item.classList.add('Mui-selected');
          
          // Mark parent items as in active trail
          let parent = item.closest('.MuiMenu-submenu');
          while (parent) {
            const parentItem = parent.previousElementSibling;
            if (parentItem && parentItem.classList.contains('MuiMenuItem-root')) {
              parentItem.classList.add('in-active-trail');
            }
            parent = parent.closest('.MuiMenu-submenu')?.parentElement?.closest('.MuiMenu-submenu');
          }
        }
      });
    },

    /**
     * Setup AJAX integration for dynamic menu updates.
     */
    setupAjaxIntegration: function () {
      const self = this;
      
      // Listen for menu updates via AJAX
      document.addEventListener('drupal:menu:updated', function (e) {
        if (e.detail.menuName === self.menuName) {
          self.refreshMenu();
        }
      });
      
      // Handle AJAX form submissions that might affect menu
      document.addEventListener('drupal:ajax:complete', function (e) {
        // Check if the AJAX response includes menu updates
        if (e.detail && e.detail.response) {
          const response = e.detail.response;
          response.forEach(function (command) {
            if (command.command === 'muiMenuUpdate' && command.menuName === self.menuName) {
              self.updateMenuItems(command.items);
            }
          });
        }
      });
    },

    /**
     * Refresh the entire menu.
     */
    refreshMenu: function () {
      const self = this;
      
      if (!this.menuName) return;
      
      // Make AJAX request to refresh menu
      const xhr = new XMLHttpRequest();
      xhr.open('POST', Drupal.url('mui-menu-drupal/refresh'), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.html) {
              // Replace menu content
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = response.html;
              const newMenu = tempDiv.querySelector('.mui-menu-drupal');
              
              if (newMenu) {
                self.element.replaceWith(newMenu);
                
                // Re-initialize behaviors on new content
                Drupal.behaviors.muiMenuDrupal.attach(newMenu);
              }
            }
          } catch (e) {
            console.error('Error parsing menu refresh response:', e);
          }
        }
      };
      
      xhr.send(JSON.stringify({
        menuName: this.menuName,
        token: drupalSettings.muiMenuDrupal?.csrfToken
      }));
    },

    /**
     * Update specific menu items.
     */
    updateMenuItems: function (items) {
      if (!this.muiMenuInstance) return;
      
      // Update the MUI menu items
      items.forEach(function (itemData) {
        const menuItem = this.element.querySelector(`[data-id="${itemData.id}"]`);
        if (menuItem) {
          // Update text
          const primaryText = menuItem.querySelector('.MuiMenuItem-primary');
          if (primaryText && itemData.text) {
            primaryText.textContent = itemData.text;
          }
          
          // Update URL
          if (itemData.url && menuItem.tagName === 'A') {
            menuItem.href = itemData.url;
          }
          
          // Update disabled state
          if (itemData.hasOwnProperty('disabled')) {
            menuItem.classList.toggle('Mui-disabled', itemData.disabled);
          }
          
          // Update selected state
          if (itemData.hasOwnProperty('selected')) {
            menuItem.classList.toggle('Mui-selected', itemData.selected);
          }
        }
      });
    },

    /**
     * Handle menu visibility based on user permissions.
     */
    checkMenuAccess: function () {
      const self = this;
      
      // Check if user has access to view this menu
      if (drupalSettings.muiMenuDrupal?.accessChecking) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', Drupal.url('mui-menu-drupal/check-access'), true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function () {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (!response.access) {
                self.element.style.display = 'none';
              }
            } catch (e) {
              console.error('Error checking menu access:', e);
            }
          }
        };
        
        xhr.send(JSON.stringify({
          menuName: this.menuName,
          token: drupalSettings.muiMenuDrupal?.csrfToken
        }));
      }
    },

    /**
     * Add custom menu item click handler.
     */
    addItemClickHandler: function (selector, handler) {
      const items = this.element.querySelectorAll(selector);
      items.forEach(function (item) {
        item.addEventListener('click', handler);
      });
    },

    /**
     * Get Drupal menu metadata.
     */
    getMenuMetadata: function () {
      return {
        menuName: this.menuName,
        element: this.element,
        muiMenuInstance: this.muiMenuInstance,
        itemCount: this.element.querySelectorAll('.MuiMenuItem-root').length
      };
    },

    /**
     * Destroy Drupal menu instance.
     */
    destroy: function () {
      // Clean up any event listeners
      if (this.muiMenuInstance) {
        this.muiMenuInstance.destroy();
      }
      
      // Remove instance reference
      delete this.element.muiMenuDrupal;
    }
  };

  /**
   * Utility functions for Drupal menu integration.
   */
  Drupal.muiMenuDrupal = {
    
    /**
     * Create a Drupal-integrated menu programmatically.
     */
    create: function (menuName, options = {}) {
      const defaults = {
        variant: 'menu',
        elevation: 8,
        checkAccess: true,
        showActiveTrail: true
      };
      
      const settings = Object.assign({}, defaults, options);
      
      // Make AJAX request to load menu
      return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', Drupal.url('mui-menu-drupal/load'), true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function () {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = response.html;
                const menuElement = tempDiv.querySelector('.mui-menu-drupal');
                
                if (menuElement) {
                  const instance = new MuiMenuDrupal(menuElement);
                  resolve({
                    element: menuElement,
                    instance: instance
                  });
                } else {
                  reject(new Error('Invalid menu HTML returned'));
                }
              } else {
                reject(new Error('No HTML returned for menu'));
              }
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = function () {
          reject(new Error('Network error'));
        };
        
        xhr.send(JSON.stringify({
          menuName: menuName,
          options: settings,
          token: drupalSettings.muiMenuDrupal?.csrfToken
        }));
      });
    },
    
    /**
     * Get Drupal menu instance from element.
     */
    getInstance: function (element) {
      const menu = element.closest('.mui-menu-drupal');
      return menu ? menu.muiMenuDrupal : null;
    },
    
    /**
     * Refresh all Drupal menus on the page.
     */
    refreshAll: function () {
      const menus = document.querySelectorAll('.mui-menu-drupal');
      menus.forEach(function (menu) {
        const instance = menu.muiMenuDrupal;
        if (instance) {
          instance.refreshMenu();
        }
      });
    }
  };

  /**
   * Add custom AJAX command for menu updates.
   */
  Drupal.AjaxCommands.prototype.muiMenuUpdate = function (ajax, response, status) {
    const event = new CustomEvent('drupal:ajax:complete', {
      detail: { response: [response] }
    });
    document.dispatchEvent(event);
  };

})(Drupal, drupalSettings, once);