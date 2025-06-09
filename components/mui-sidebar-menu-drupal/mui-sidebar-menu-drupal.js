/**
 * @file
 * MUI Sidebar Menu Drupal Integration JavaScript.
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * Initialize MUI Sidebar Menu Drupal integration functionality.
   */
  Drupal.behaviors.muiSidebarMenuDrupal = {
    attach: function (context, settings) {
      const drupalSidebarMenus = once('mui-sidebar-menu-drupal', '.mui-sidebar-menu-drupal', context);
      
      drupalSidebarMenus.forEach(function (sidebarMenu) {
        new MuiSidebarMenuDrupal(sidebarMenu);
      });
    }
  };

  /**
   * MUI Sidebar Menu Drupal class for enhanced Drupal integration.
   */
  function MuiSidebarMenuDrupal(element) {
    this.element = element;
    this.menuName = element.dataset.menuName;
    this.muiSidebarMenu = element.querySelector('.MuiSidebarMenu-root');
    this.muiSidebarMenuInstance = this.muiSidebarMenu ? this.muiSidebarMenu.muiSidebarMenu : null;
    
    this.init();
  }

  MuiSidebarMenuDrupal.prototype = {
    
    /**
     * Initialize Drupal-specific functionality.
     */
    init: function () {
      this.bindDrupalEvents();
      this.setupActiveTrailHandling();
      this.setupAjaxIntegration();
      this.setupSidebarSpecificFeatures();
      
      // Store instance on element
      this.element.muiSidebarMenuDrupal = this;
    },

    /**
     * Bind Drupal-specific events.
     */
    bindDrupalEvents: function () {
      const self = this;
      
      // Handle Drupal sidebar menu item clicks for analytics/tracking
      this.element.addEventListener('click', function (e) {
        const link = e.target.closest('.MuiSidebarMenu-link');
        if (link) {
          const url = link.getAttribute('href');
          const text = link.querySelector('.MuiSidebarMenu-linkText')?.textContent || '';
          
          if (url && url !== '#') {
            // Trigger Drupal behaviors for menu tracking
            Drupal.announce(Drupal.t('Navigating to @title', {
              '@title': text
            }));
            
            // Custom sidebar menu selection event for modules to listen to
            const drupalEvent = new CustomEvent('drupal:sidebar-menu:selection', {
              bubbles: true,
              detail: {
                menuName: self.menuName,
                itemText: text,
                itemUrl: url,
                element: link
              }
            });
            document.dispatchEvent(drupalEvent);
          }
        }
      });
      
      // Handle external link warnings
      this.element.addEventListener('click', function (e) {
        const link = e.target.closest('a[target="_blank"]');
        if (link && drupalSettings.muiSidebarMenuDrupal?.warnExternalLinks) {
          const confirmed = confirm(Drupal.t('This link will open in a new window. Continue?'));
          if (!confirmed) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      });
      
      // Handle expand/collapse events
      this.element.addEventListener('mui:submenu:expanded', function (e) {
        // Store expanded state in local storage if available
        if (typeof Storage !== 'undefined') {
          const expandedItems = JSON.parse(localStorage.getItem(`sidebar_expanded_${self.menuName}`) || '[]');
          const itemId = e.detail.submenu.id;
          if (itemId && !expandedItems.includes(itemId)) {
            expandedItems.push(itemId);
            localStorage.setItem(`sidebar_expanded_${self.menuName}`, JSON.stringify(expandedItems));
          }
        }
      });
      
      this.element.addEventListener('mui:submenu:collapsed', function (e) {
        // Remove from expanded state
        if (typeof Storage !== 'undefined') {
          const expandedItems = JSON.parse(localStorage.getItem(`sidebar_expanded_${self.menuName}`) || '[]');
          const itemId = e.detail.submenu.id;
          if (itemId) {
            const index = expandedItems.indexOf(itemId);
            if (index > -1) {
              expandedItems.splice(index, 1);
              localStorage.setItem(`sidebar_expanded_${self.menuName}`, JSON.stringify(expandedItems));
            }
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
      
      // Initial active trail update
      this.updateActiveTrail();
    },

    /**
     * Update active trail based on current URL.
     */
    updateActiveTrail: function () {
      const currentPath = window.location.pathname;
      const menuLinks = this.element.querySelectorAll('.MuiSidebarMenu-link[href]');
      
      menuLinks.forEach(function (link) {
        const itemPath = new URL(link.href, window.location.origin).pathname;
        
        // Remove existing active trail classes
        link.classList.remove('MuiSidebarMenu-activeTrail', 'in-active-trail');
        link.removeAttribute('aria-current');
        
        // Add active trail if paths match
        if (itemPath === currentPath) {
          link.classList.add('MuiSidebarMenu-activeTrail');
          link.setAttribute('aria-current', 'page');
          
          // Mark parent items as in active trail and expand them
          let parentSubmenu = link.closest('.MuiSidebarMenu-submenu');
          while (parentSubmenu) {
            const parentItem = parentSubmenu.closest('.MuiSidebarMenu-item');
            if (parentItem) {
              const parentLink = parentItem.querySelector('.MuiSidebarMenu-link');
              if (parentLink) {
                parentLink.classList.add('in-active-trail');
              }
              
              // Auto-expand parent if configured
              const expandButton = parentItem.querySelector('.MuiSidebarMenu-expandButton');
              if (expandButton && expandButton.getAttribute('aria-expanded') === 'false') {
                expandButton.click();
              }
            }
            
            // Move up to next parent
            parentSubmenu = parentSubmenu.parentElement.closest('.MuiSidebarMenu-submenu');
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
      document.addEventListener('drupal:sidebar-menu:updated', function (e) {
        if (e.detail.menuName === self.menuName) {
          self.refreshSidebarMenu();
        }
      });
      
      // Handle AJAX form submissions that might affect menu
      document.addEventListener('drupal:ajax:complete', function (e) {
        // Check if the AJAX response includes menu updates
        if (e.detail && e.detail.response) {
          const response = e.detail.response;
          response.forEach(function (command) {
            if (command.command === 'muiSidebarMenuUpdate' && command.menuName === self.menuName) {
              self.updateSidebarMenuItems(command.items);
            }
          });
        }
      });
    },

    /**
     * Setup sidebar-specific features.
     */
    setupSidebarSpecificFeatures: function () {
      const self = this;
      
      // Restore expanded state from localStorage
      this.restoreExpandedState();
      
      // Setup keyboard navigation for sidebar
      this.setupSidebarKeyboardNavigation();
      
      // Setup resize handling for responsive sidebar
      this.setupResponsiveHandling();
    },

    /**
     * Restore expanded state from localStorage.
     */
    restoreExpandedState: function () {
      if (typeof Storage !== 'undefined') {
        const expandedItems = JSON.parse(localStorage.getItem(`sidebar_expanded_${this.menuName}`) || '[]');
        
        expandedItems.forEach(function (itemId) {
          const submenu = document.getElementById(itemId);
          if (submenu) {
            const button = document.querySelector(`[data-target="${itemId}"]`);
            if (button && button.getAttribute('aria-expanded') === 'false') {
              button.click();
            }
          }
        });
      }
    },

    /**
     * Setup keyboard navigation specific to sidebar.
     */
    setupSidebarKeyboardNavigation: function () {
      const self = this;
      
      this.element.addEventListener('keydown', function (e) {
        // Additional sidebar-specific keyboard shortcuts
        switch (e.key) {
          case 'Home':
            if (e.ctrlKey) {
              e.preventDefault();
              // Jump to first menu item
              const firstLink = self.element.querySelector('.MuiSidebarMenu-link');
              if (firstLink) firstLink.focus();
            }
            break;
            
          case 'End':
            if (e.ctrlKey) {
              e.preventDefault();
              // Jump to last menu item
              const allLinks = self.element.querySelectorAll('.MuiSidebarMenu-link');
              if (allLinks.length > 0) {
                allLinks[allLinks.length - 1].focus();
              }
            }
            break;
            
          case '*':
            e.preventDefault();
            // Expand all items
            if (self.muiSidebarMenuInstance && self.muiSidebarMenuInstance.expandAll) {
              self.muiSidebarMenuInstance.expandAll();
            }
            break;
            
          case '/':
            e.preventDefault();
            // Collapse all items
            if (self.muiSidebarMenuInstance && self.muiSidebarMenuInstance.collapseAll) {
              self.muiSidebarMenuInstance.collapseAll();
            }
            break;
        }
      });
    },

    /**
     * Setup responsive handling for sidebar.
     */
    setupResponsiveHandling: function () {
      const self = this;
      
      // Handle mobile/desktop transitions
      if (window.matchMedia) {
        const mobileQuery = window.matchMedia('(max-width: 768px)');
        
        function handleMobileChange(e) {
          if (e.matches) {
            // Mobile view: collapse all by default
            if (self.muiSidebarMenuInstance && self.muiSidebarMenuInstance.collapseAll) {
              self.muiSidebarMenuInstance.collapseAll();
            }
          } else {
            // Desktop view: restore expanded state
            self.restoreExpandedState();
          }
        }
        
        mobileQuery.addListener(handleMobileChange);
        handleMobileChange(mobileQuery); // Initial check
      }
    },

    /**
     * Refresh the entire sidebar menu.
     */
    refreshSidebarMenu: function () {
      const self = this;
      
      if (!this.menuName) return;
      
      // Make AJAX request to refresh sidebar menu
      const xhr = new XMLHttpRequest();
      xhr.open('POST', Drupal.url('mui-sidebar-menu-drupal/refresh'), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.html) {
              // Replace sidebar menu content
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = response.html;
              const newSidebarMenu = tempDiv.querySelector('.mui-sidebar-menu-drupal');
              
              if (newSidebarMenu) {
                self.element.replaceWith(newSidebarMenu);
                
                // Re-initialize behaviors on new content
                Drupal.behaviors.muiSidebarMenuDrupal.attach(newSidebarMenu);
              }
            }
          } catch (e) {
            console.error('Error parsing sidebar menu refresh response:', e);
          }
        }
      };
      
      xhr.send(JSON.stringify({
        menuName: this.menuName,
        token: drupalSettings.muiSidebarMenuDrupal?.csrfToken
      }));
    },

    /**
     * Update specific sidebar menu items.
     */
    updateSidebarMenuItems: function (items) {
      if (!this.muiSidebarMenuInstance) return;
      
      // Update the MUI sidebar menu items
      items.forEach(function (itemData) {
        const menuItem = this.element.querySelector(`[data-id="${itemData.id}"]`);
        if (menuItem) {
          // Update text
          const linkText = menuItem.querySelector('.MuiSidebarMenu-linkText');
          if (linkText && itemData.text) {
            linkText.textContent = itemData.text;
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
            menuItem.classList.toggle('MuiSidebarMenu-activeTrail', itemData.selected);
          }
        }
      });
    },

    /**
     * Get Drupal sidebar menu metadata.
     */
    getSidebarMenuMetadata: function () {
      return {
        menuName: this.menuName,
        element: this.element,
        muiSidebarMenuInstance: this.muiSidebarMenuInstance,
        itemCount: this.element.querySelectorAll('.MuiSidebarMenu-link').length,
        expandedItems: this.getExpandedItems()
      };
    },

    /**
     * Get currently expanded items.
     */
    getExpandedItems: function () {
      const expandedItems = [];
      const expandedButtons = this.element.querySelectorAll('.MuiSidebarMenu-expandButton[aria-expanded="true"]');
      
      expandedButtons.forEach(function (button) {
        const targetId = button.getAttribute('data-target');
        if (targetId) {
          expandedItems.push(targetId);
        }
      });
      
      return expandedItems;
    },

    /**
     * Destroy Drupal sidebar menu instance.
     */
    destroy: function () {
      // Clean up any event listeners
      if (this.muiSidebarMenuInstance) {
        this.muiSidebarMenuInstance.destroy();
      }
      
      // Remove instance reference
      delete this.element.muiSidebarMenuDrupal;
    }
  };

  /**
   * Utility functions for Drupal sidebar menu integration.
   */
  Drupal.muiSidebarMenuDrupal = {
    
    /**
     * Create a Drupal-integrated sidebar menu programmatically.
     */
    create: function (menuName, options = {}) {
      const defaults = {
        collapsible: true,
        compact: false,
        showIcons: true,
        checkAccess: true,
        showActiveTrail: true
      };
      
      const settings = Object.assign({}, defaults, options);
      
      // Make AJAX request to load sidebar menu
      return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', Drupal.url('mui-sidebar-menu-drupal/load'), true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function () {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = response.html;
                const sidebarMenuElement = tempDiv.querySelector('.mui-sidebar-menu-drupal');
                
                if (sidebarMenuElement) {
                  const instance = new MuiSidebarMenuDrupal(sidebarMenuElement);
                  resolve({
                    element: sidebarMenuElement,
                    instance: instance
                  });
                } else {
                  reject(new Error('Invalid sidebar menu HTML returned'));
                }
              } else {
                reject(new Error('No HTML returned for sidebar menu'));
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
          token: drupalSettings.muiSidebarMenuDrupal?.csrfToken
        }));
      });
    },
    
    /**
     * Get Drupal sidebar menu instance from element.
     */
    getInstance: function (element) {
      const sidebarMenu = element.closest('.mui-sidebar-menu-drupal');
      return sidebarMenu ? sidebarMenu.muiSidebarMenuDrupal : null;
    },
    
    /**
     * Refresh all Drupal sidebar menus on the page.
     */
    refreshAll: function () {
      const sidebarMenus = document.querySelectorAll('.mui-sidebar-menu-drupal');
      sidebarMenus.forEach(function (sidebarMenu) {
        const instance = sidebarMenu.muiSidebarMenuDrupal;
        if (instance) {
          instance.refreshSidebarMenu();
        }
      });
    }
  };

  /**
   * Add custom AJAX command for sidebar menu updates.
   */
  Drupal.AjaxCommands.prototype.muiSidebarMenuUpdate = function (ajax, response, status) {
    const event = new CustomEvent('drupal:ajax:complete', {
      detail: { response: [response] }
    });
    document.dispatchEvent(event);
  };

})(Drupal, drupalSettings, once);