/**
 * @file
 * MUI Breadcrumb Drupal Integration JavaScript.
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * Initialize MUI Breadcrumb Drupal integration functionality.
   */
  Drupal.behaviors.muiBreadcrumbDrupal = {
    attach: function (context, settings) {
      const drupalBreadcrumbs = once('mui-breadcrumb-drupal', '.mui-breadcrumb-drupal', context);
      
      drupalBreadcrumbs.forEach(function (breadcrumb) {
        new MuiBreadcrumbDrupal(breadcrumb);
      });
    }
  };

  /**
   * MUI Breadcrumb Drupal class for enhanced Drupal integration.
   */
  function MuiBreadcrumbDrupal(element) {
    this.element = element;
    this.breadcrumbSource = this.getBreadcrumbSource();
    this.muiBreadcrumb = element.querySelector('.MuiBreadcrumb-root');
    this.muiBreadcrumbInstance = this.muiBreadcrumb ? this.muiBreadcrumb.muiBreadcrumb : null;
    this.trackAnalytics = element.dataset.trackAnalytics === 'true';
    
    this.init();
  }

  MuiBreadcrumbDrupal.prototype = {
    
    /**
     * Initialize Drupal-specific functionality.
     */
    init: function () {
      this.bindDrupalEvents();
      this.setupAnalyticsTracking();
      this.setupAjaxIntegration();
      this.handleEntityUpdates();
      
      // Store instance on element
      this.element.muiBreadcrumbDrupal = this;
    },

    /**
     * Get breadcrumb source from CSS class.
     */
    getBreadcrumbSource: function () {
      const classes = this.element.className.split(' ');
      for (let i = 0; i < classes.length; i++) {
        if (classes[i].startsWith('breadcrumb-source-')) {
          return classes[i].replace('breadcrumb-source-', '');
        }
      }
      return 'path';
    },

    /**
     * Bind Drupal-specific events.
     */
    bindDrupalEvents: function () {
      const self = this;
      
      // Handle Drupal breadcrumb clicks for navigation tracking
      this.element.addEventListener('mui:breadcrumb:click', function (e) {
        const link = e.detail.link;
        const url = e.detail.url;
        const text = e.detail.text;
        
        // Announce navigation for screen readers
        Drupal.announce(Drupal.t('Navigating to @title', {
          '@title': text
        }));
        
        // Custom breadcrumb click event for modules to listen to
        const drupalEvent = new CustomEvent('drupal:breadcrumb:click', {
          bubbles: true,
          detail: {
            source: self.breadcrumbSource,
            itemText: text,
            itemUrl: url,
            element: link,
            entityData: self.getEntityDataFromLink(link)
          }
        });
        document.dispatchEvent(drupalEvent);
      });
      
      // Handle path changes for SPA-like behavior
      if (window.history && window.history.pushState) {
        window.addEventListener('popstate', function () {
          self.updateBreadcrumbForCurrentPath();
        });
      }
    },

    /**
     * Setup analytics tracking for breadcrumb interactions.
     */
    setupAnalyticsTracking: function () {
      const self = this;
      
      if (!this.trackAnalytics) return;
      
      this.element.addEventListener('mui:breadcrumb:click', function (e) {
        // Track breadcrumb clicks
        self.trackBreadcrumbClick(e.detail);
      });
      
      this.element.addEventListener('mui:breadcrumb:expanded', function (e) {
        // Track breadcrumb expansions
        self.trackBreadcrumbExpansion(e.detail);
      });
    },

    /**
     * Track breadcrumb click events.
     */
    trackBreadcrumbClick: function (detail) {
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', 'breadcrumb_click', {
          'breadcrumb_source': this.breadcrumbSource,
          'breadcrumb_text': detail.text,
          'breadcrumb_url': detail.url,
          'page_location': window.location.href
        });
      }
      
      // Adobe Analytics
      if (typeof s !== 'undefined' && s.tl) {
        s.linkTrackVars = 'prop1,prop2,eVar1';
        s.prop1 = 'breadcrumb_click';
        s.prop2 = this.breadcrumbSource;
        s.eVar1 = detail.text;
        s.tl(true, 'o', 'Breadcrumb Click');
      }
      
      // Custom tracking event
      const trackingEvent = new CustomEvent('drupal:analytics:breadcrumb', {
        detail: {
          action: 'click',
          source: this.breadcrumbSource,
          text: detail.text,
          url: detail.url
        }
      });
      document.dispatchEvent(trackingEvent);
    },

    /**
     * Track breadcrumb expansion events.
     */
    trackBreadcrumbExpansion: function (detail) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'breadcrumb_expand', {
          'breadcrumb_source': this.breadcrumbSource,
          'page_location': window.location.href
        });
      }
    },

    /**
     * Setup AJAX integration for dynamic breadcrumb updates.
     */
    setupAjaxIntegration: function () {
      const self = this;
      
      // Listen for content updates that might affect breadcrumbs
      document.addEventListener('drupal:ajax:complete', function (e) {
        // Check if the AJAX response includes breadcrumb updates
        if (e.detail && e.detail.response) {
          const response = e.detail.response;
          response.forEach(function (command) {
            if (command.command === 'muiBreadcrumbUpdate') {
              self.updateBreadcrumb(command.breadcrumbs);
            }
          });
        }
      });
      
      // Listen for entity updates
      document.addEventListener('drupal:entity:updated', function (e) {
        if (self.shouldUpdateForEntity(e.detail.entityType, e.detail.entityId)) {
          self.refreshBreadcrumb();
        }
      });
    },

    /**
     * Handle entity updates that affect breadcrumbs.
     */
    handleEntityUpdates: function () {
      const self = this;
      
      // Listen for node updates
      document.addEventListener('drupal:node:updated', function (e) {
        if (self.breadcrumbSource === 'taxonomy' || self.breadcrumbSource === 'menu') {
          self.refreshBreadcrumb();
        }
      });
      
      // Listen for taxonomy term updates
      document.addEventListener('drupal:taxonomy:updated', function (e) {
        if (self.breadcrumbSource === 'taxonomy') {
          self.refreshBreadcrumb();
        }
      });
      
      // Listen for menu updates
      document.addEventListener('drupal:menu:updated', function (e) {
        if (self.breadcrumbSource === 'menu') {
          self.refreshBreadcrumb();
        }
      });
    },

    /**
     * Get entity data from breadcrumb link.
     */
    getEntityDataFromLink: function (link) {
      const data = {};
      
      // Extract data attributes
      for (let i = 0; i < link.attributes.length; i++) {
        const attr = link.attributes[i];
        if (attr.name.startsWith('data-entity-')) {
          const key = attr.name.replace('data-entity-', '');
          data[key] = attr.value;
        }
      }
      
      return data;
    },

    /**
     * Check if breadcrumb should update for entity change.
     */
    shouldUpdateForEntity: function (entityType, entityId) {
      // Get current entity data from breadcrumb links
      const links = this.element.querySelectorAll('[data-entity-type][data-entity-id]');
      
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        if (link.dataset.entityType === entityType && 
            link.dataset.entityId === entityId) {
          return true;
        }
      }
      
      return false;
    },

    /**
     * Update breadcrumb for current path.
     */
    updateBreadcrumbForCurrentPath: function () {
      // This would typically require a server request
      this.refreshBreadcrumb();
    },

    /**
     * Refresh the entire breadcrumb.
     */
    refreshBreadcrumb: function () {
      const self = this;
      
      // Make AJAX request to refresh breadcrumb
      const xhr = new XMLHttpRequest();
      xhr.open('POST', Drupal.url('mui-breadcrumb-drupal/refresh'), true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.html) {
              // Replace breadcrumb content
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = response.html;
              const newBreadcrumb = tempDiv.querySelector('.mui-breadcrumb-drupal');
              
              if (newBreadcrumb) {
                self.element.replaceWith(newBreadcrumb);
                
                // Re-initialize behaviors on new content
                Drupal.behaviors.muiBreadcrumbDrupal.attach(newBreadcrumb);
              }
            }
          } catch (e) {
            console.error('Error parsing breadcrumb refresh response:', e);
          }
        }
      };
      
      xhr.send(JSON.stringify({
        source: this.breadcrumbSource,
        currentPath: window.location.pathname,
        token: drupalSettings.muiBreadcrumbDrupal?.csrfToken
      }));
    },

    /**
     * Update specific breadcrumb items.
     */
    updateBreadcrumb: function (breadcrumbs) {
      if (!this.muiBreadcrumbInstance) return;
      
      // Update the MUI breadcrumb with new data
      this.muiBreadcrumbInstance.updateBreadcrumb(breadcrumbs);
    },

    /**
     * Get breadcrumb metadata.
     */
    getBreadcrumbMetadata: function () {
      const links = this.element.querySelectorAll('.MuiBreadcrumb-link');
      const currentText = this.element.querySelector('.MuiBreadcrumb-currentText');
      
      return {
        source: this.breadcrumbSource,
        element: this.element,
        muiBreadcrumbInstance: this.muiBreadcrumbInstance,
        itemCount: links.length + (currentText ? 1 : 0),
        path: this.muiBreadcrumbInstance ? this.muiBreadcrumbInstance.getBreadcrumbPath() : []
      };
    },

    /**
     * Handle keyboard shortcuts for breadcrumb navigation.
     */
    setupKeyboardShortcuts: function () {
      const self = this;
      
      document.addEventListener('keydown', function (e) {
        // Alt + Home = Go to home page
        if (e.altKey && e.key === 'Home') {
          e.preventDefault();
          const homeLink = self.element.querySelector('.MuiBreadcrumb-link');
          if (homeLink) {
            homeLink.click();
          }
        }
        
        // Alt + Up = Go to parent page
        if (e.altKey && e.key === 'ArrowUp') {
          e.preventDefault();
          const links = self.element.querySelectorAll('.MuiBreadcrumb-link');
          if (links.length > 1) {
            // Go to second-to-last breadcrumb (parent of current)
            links[links.length - 2].click();
          }
        }
      });
    },

    /**
     * Destroy Drupal breadcrumb instance.
     */
    destroy: function () {
      // Clean up any event listeners
      if (this.muiBreadcrumbInstance) {
        this.muiBreadcrumbInstance.destroy();
      }
      
      // Remove instance reference
      delete this.element.muiBreadcrumbDrupal;
    }
  };

  /**
   * Utility functions for Drupal breadcrumb integration.
   */
  Drupal.muiBreadcrumbDrupal = {
    
    /**
     * Create a Drupal-integrated breadcrumb programmatically.
     */
    create: function (source, options = {}) {
      const defaults = {
        variant: 'standard',
        size: 'medium',
        showHome: true,
        showCurrent: true,
        checkAccess: true
      };
      
      const settings = Object.assign({}, defaults, options);
      
      // Make AJAX request to generate breadcrumb
      return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', Drupal.url('mui-breadcrumb-drupal/generate'), true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function () {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = response.html;
                const breadcrumbElement = tempDiv.querySelector('.mui-breadcrumb-drupal');
                
                if (breadcrumbElement) {
                  const instance = new MuiBreadcrumbDrupal(breadcrumbElement);
                  resolve({
                    element: breadcrumbElement,
                    instance: instance
                  });
                } else {
                  reject(new Error('Invalid breadcrumb HTML returned'));
                }
              } else {
                reject(new Error('No HTML returned for breadcrumb'));
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
          source: source,
          options: settings,
          token: drupalSettings.muiBreadcrumbDrupal?.csrfToken
        }));
      });
    },
    
    /**
     * Get Drupal breadcrumb instance from element.
     */
    getInstance: function (element) {
      const breadcrumb = element.closest('.mui-breadcrumb-drupal');
      return breadcrumb ? breadcrumb.muiBreadcrumbDrupal : null;
    },
    
    /**
     * Refresh all Drupal breadcrumbs on the page.
     */
    refreshAll: function () {
      const breadcrumbs = document.querySelectorAll('.mui-breadcrumb-drupal');
      breadcrumbs.forEach(function (breadcrumb) {
        const instance = breadcrumb.muiBreadcrumbDrupal;
        if (instance) {
          instance.refreshBreadcrumb();
        }
      });
    }
  };

  /**
   * Add custom AJAX command for breadcrumb updates.
   */
  Drupal.AjaxCommands.prototype.muiBreadcrumbUpdate = function (ajax, response, status) {
    const event = new CustomEvent('drupal:ajax:complete', {
      detail: { response: [response] }
    });
    document.dispatchEvent(event);
  };

})(Drupal, drupalSettings, once);