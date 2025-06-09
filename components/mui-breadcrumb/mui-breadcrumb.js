/**
 * @file
 * MUI Breadcrumb component JavaScript for interactive functionality.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Initialize MUI Breadcrumb functionality.
   */
  Drupal.behaviors.muiBreadcrumb = {
    attach: function (context, settings) {
      const breadcrumbs = once('mui-breadcrumb', '.MuiBreadcrumb-root', context);
      
      breadcrumbs.forEach(function (breadcrumb) {
        new MuiBreadcrumb(breadcrumb);
      });
    }
  };

  /**
   * MUI Breadcrumb class.
   */
  function MuiBreadcrumb(element) {
    this.element = element;
    this.collapseButtons = element.querySelectorAll('.MuiBreadcrumb-collapseButton');
    this.collapsedItems = element.querySelectorAll('.MuiBreadcrumb-collapsedItems');
    this.breadcrumbLinks = element.querySelectorAll('.MuiBreadcrumb-link');
    
    this.expandable = element.classList.contains('MuiBreadcrumb-expandable');
    this.clickHandler = element.dataset.clickHandler;
    
    this.init();
  }

  MuiBreadcrumb.prototype = {
    
    /**
     * Initialize breadcrumb functionality.
     */
    init: function () {
      this.bindEvents();
      this.setupKeyboardNavigation();
      this.handleResponsiveCollapse();
      
      // Store instance on element
      this.element.muiBreadcrumb = this;
      
      // Handle window resize for responsive behavior
      window.addEventListener('resize', this.debounce(() => {
        this.handleResponsiveCollapse();
      }, 250));
    },

    /**
     * Bind event listeners.
     */
    bindEvents: function () {
      const self = this;
      
      // Collapse/expand button functionality
      this.collapseButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          self.toggleCollapsedItems(button);
        });
      });
      
      // Close collapsed items when clicking outside
      document.addEventListener('click', function (e) {
        if (!self.element.contains(e.target)) {
          self.closeAllCollapsedItems();
        }
      });
      
      // Handle breadcrumb link clicks
      this.breadcrumbLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          self.handleBreadcrumbClick(e, link);
        });
      });
      
      // Handle escape key to close collapsed items
      this.element.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          self.closeAllCollapsedItems();
        }
      });
    },

    /**
     * Setup keyboard navigation.
     */
    setupKeyboardNavigation: function () {
      const focusableElements = this.element.querySelectorAll('a, button');
      
      this.element.addEventListener('keydown', function (e) {
        const currentIndex = Array.from(focusableElements).indexOf(e.target);
        
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            const prevIndex = Math.max(currentIndex - 1, 0);
            focusableElements[prevIndex].focus();
            break;
            
          case 'ArrowRight':
            e.preventDefault();
            const nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
            focusableElements[nextIndex].focus();
            break;
            
          case 'Home':
            e.preventDefault();
            focusableElements[0].focus();
            break;
            
          case 'End':
            e.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
            break;
        }
      });
    },

    /**
     * Toggle collapsed items visibility.
     */
    toggleCollapsedItems: function (button) {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      
      // Close all other collapsed items first
      this.closeAllCollapsedItems();
      
      if (!isExpanded) {
        this.expandCollapsedItems(button);
      }
    },

    /**
     * Expand collapsed items.
     */
    expandCollapsedItems: function (button) {
      const collapsedItems = button.nextElementSibling;
      
      if (collapsedItems && collapsedItems.classList.contains('MuiBreadcrumb-collapsedItems')) {
        button.setAttribute('aria-expanded', 'true');
        collapsedItems.setAttribute('aria-hidden', 'false');
        
        // Focus first item in collapsed list
        setTimeout(() => {
          const firstLink = collapsedItems.querySelector('.MuiBreadcrumb-link');
          if (firstLink) {
            firstLink.focus();
          }
        }, 100);
        
        // Dispatch expand event
        this.element.dispatchEvent(new CustomEvent('mui:breadcrumb:expanded', {
          bubbles: true,
          detail: { 
            button: button,
            collapsedItems: collapsedItems
          }
        }));
      }
    },

    /**
     * Close all collapsed items.
     */
    closeAllCollapsedItems: function () {
      this.collapseButtons.forEach(function (button) {
        const collapsedItems = button.nextElementSibling;
        
        button.setAttribute('aria-expanded', 'false');
        if (collapsedItems) {
          collapsedItems.setAttribute('aria-hidden', 'true');
        }
      });
    },

    /**
     * Handle breadcrumb link clicks.
     */
    handleBreadcrumbClick: function (e, link) {
      // Call custom click handler if provided
      if (this.clickHandler && typeof window[this.clickHandler] === 'function') {
        const result = window[this.clickHandler].call(link, e, this);
        if (result === false) {
          e.preventDefault();
          return;
        }
      }
      
      // Dispatch breadcrumb click event
      this.element.dispatchEvent(new CustomEvent('mui:breadcrumb:click', {
        bubbles: true,
        detail: { 
          link: link,
          text: link.textContent.trim(),
          url: link.href,
          event: e
        }
      }));
    },

    /**
     * Handle responsive collapsing of breadcrumb items.
     */
    handleResponsiveCollapse: function () {
      const containerWidth = this.element.offsetWidth;
      const items = this.element.querySelectorAll('.MuiBreadcrumb-listItem:not(.MuiBreadcrumb-collapsedItem)');
      
      if (containerWidth < 600) {
        this.applyMobileCollapse(items);
      } else {
        this.removeMobileCollapse(items);
      }
    },

    /**
     * Apply mobile-specific collapsing.
     */
    applyMobileCollapse: function (items) {
      // Hide middle items on mobile, keep first and last
      items.forEach(function (item, index) {
        if (index > 0 && index < items.length - 1) {
          item.style.display = 'none';
        }
      });
      
      // Show collapse indicator if items were hidden
      if (items.length > 2) {
        this.showMobileCollapseIndicator(items);
      }
    },

    /**
     * Remove mobile collapsing.
     */
    removeMobileCollapse: function (items) {
      items.forEach(function (item) {
        item.style.display = '';
      });
      this.hideMobileCollapseIndicator();
    },

    /**
     * Show mobile collapse indicator.
     */
    showMobileCollapseIndicator: function (items) {
      // Check if indicator already exists
      let indicator = this.element.querySelector('.MuiBreadcrumb-mobileCollapse');
      
      if (!indicator && items.length > 2) {
        indicator = document.createElement('li');
        indicator.className = 'MuiBreadcrumb-listItem MuiBreadcrumb-mobileCollapse';
        indicator.innerHTML = `
          <span class="MuiBreadcrumb-collapseText">...</span>
          <span class="MuiBreadcrumb-separator" aria-hidden="true">/</span>
        `;
        
        // Insert between first and last item
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        lastItem.parentNode.insertBefore(indicator, lastItem);
      }
    },

    /**
     * Hide mobile collapse indicator.
     */
    hideMobileCollapseIndicator: function () {
      const indicator = this.element.querySelector('.MuiBreadcrumb-mobileCollapse');
      if (indicator) {
        indicator.remove();
      }
    },

    /**
     * Get breadcrumb path as array.
     */
    getBreadcrumbPath: function () {
      const links = this.element.querySelectorAll('.MuiBreadcrumb-link');
      const currentText = this.element.querySelector('.MuiBreadcrumb-currentText');
      
      const path = Array.from(links).map(function (link) {
        return {
          text: link.textContent.trim(),
          url: link.href
        };
      });
      
      if (currentText) {
        path.push({
          text: currentText.textContent.trim(),
          url: window.location.href,
          current: true
        });
      }
      
      return path;
    },

    /**
     * Update breadcrumb items programmatically.
     */
    updateBreadcrumb: function (items) {
      // This would require regenerating the breadcrumb HTML
      // For now, dispatch an event that can be handled by parent components
      this.element.dispatchEvent(new CustomEvent('mui:breadcrumb:update', {
        bubbles: true,
        detail: { 
          items: items,
          breadcrumb: this
        }
      }));
    },

    /**
     * Debounce utility function.
     */
    debounce: function (func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Destroy breadcrumb instance.
     */
    destroy: function () {
      // Remove event listeners
      this.closeAllCollapsedItems();
      
      // Remove instance reference
      delete this.element.muiBreadcrumb;
    }
  };

  /**
   * Utility functions for breadcrumb management.
   */
  Drupal.muiBreadcrumb = {
    
    /**
     * Create a breadcrumb programmatically.
     */
    create: function (items, options = {}) {
      const defaults = {
        variant: 'standard',
        size: 'medium',
        color: 'default',
        separator: '/',
        showHome: true,
        homeText: 'Home',
        homeUrl: '/',
        structuredData: true
      };
      
      const settings = Object.assign({}, defaults, options);
      
      // Create breadcrumb element
      const breadcrumbElement = document.createElement('nav');
      breadcrumbElement.className = `MuiBreadcrumb-root MuiBreadcrumb-${settings.variant} MuiBreadcrumb-size${settings.size} MuiBreadcrumb-color${settings.color}`;
      breadcrumbElement.setAttribute('aria-label', 'Breadcrumb navigation');
      
      // Build breadcrumb HTML (simplified version)
      let html = '<ol class="MuiBreadcrumb-list" role="list">';
      
      items.forEach(function (item, index) {
        const isLast = index === items.length - 1;
        html += '<li class="MuiBreadcrumb-listItem">';
        
        if (item.url && !item.current) {
          html += `<a href="${item.url}" class="MuiBreadcrumb-link MuiLink-root">`;
          html += `<span class="MuiBreadcrumb-linkText MuiTypography-body2">${item.text}</span>`;
          html += '</a>';
        } else {
          html += `<span class="MuiBreadcrumb-currentText MuiTypography-body2" aria-current="page">${item.text}</span>`;
        }
        
        if (!isLast) {
          html += `<span class="MuiBreadcrumb-separator" aria-hidden="true">${settings.separator}</span>`;
        }
        
        html += '</li>';
      });
      
      html += '</ol>';
      breadcrumbElement.innerHTML = html;
      
      // Initialize the breadcrumb
      const breadcrumbInstance = new MuiBreadcrumb(breadcrumbElement);
      
      return {
        element: breadcrumbElement,
        instance: breadcrumbInstance
      };
    },
    
    /**
     * Get breadcrumb instance from element.
     */
    getInstance: function (element) {
      const breadcrumb = element.closest('.MuiBreadcrumb-root');
      return breadcrumb ? breadcrumb.muiBreadcrumb : null;
    }
  };

})(Drupal, once);