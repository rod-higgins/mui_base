/**
 * @file
 * Accessibility enhancements for MUI Base theme.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Accessibility enhancements behavior.
   */
  Drupal.behaviors.muiAccessibility = {
    attach: function (context, settings) {
      // Initialize all accessibility features
      this.initializeSkipLinks(context);
      this.initializeAriaLiveRegions(context);
      this.initializeFocusManagement(context);
      this.initializeKeyboardNavigation(context);
      this.initializeScreenReaderSupport(context);
      this.initializeColorContrastDetection(context);
      this.initializeMotionPreferences(context);
    },

    /**
     * Initialize skip links functionality.
     */
    initializeSkipLinks: function (context) {
      const skipLinks = once('skip-links', '.skip-link', context);
      
      skipLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          const targetId = link.getAttribute('href').substring(1);
          const target = document.getElementById(targetId);
          
          if (target) {
            e.preventDefault();
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    },

    /**
     * Initialize ARIA live regions for dynamic content updates.
     */
    initializeAriaLiveRegions: function (context) {
      // Create global live region if it doesn't exist
      if (!document.getElementById('drupal-live-announce')) {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'drupal-live-announce';
        liveRegion.className = 'visually-hidden';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
      }

      // Monitor form submissions for announcements
      const forms = once('form-announcements', 'form', context);
      forms.forEach(function (form) {
        form.addEventListener('submit', function () {
          Drupal.announceForScreenReader('Form submitted. Please wait for confirmation.');
        });
      });

      // Monitor AJAX operations
      if (typeof Drupal.Ajax !== 'undefined') {
        document.addEventListener('drupalAjaxStart', function () {
          Drupal.announceForScreenReader('Loading content...');
        });

        document.addEventListener('drupalAjaxComplete', function () {
          Drupal.announceForScreenReader('Content loaded.');
        });
      }
    },

    /**
     * Enhanced focus management.
     */
    initializeFocusManagement: function (context) {
      // Trap focus in modal dialogs
      const modals = once('modal-focus', '.ui-dialog, .MuiDialog-root', context);
      modals.forEach(function (modal) {
        trapFocusInModal(modal);
      });

      // Focus management for mobile menu
      const mobileMenus = once('mobile-menu-focus', '.MuiMobileMenu-root', context);
      mobileMenus.forEach(function (menu) {
        const toggle = menu.querySelector('.MuiMobileMenu-toggle');
        const drawer = menu.querySelector('.MuiMobileMenu-drawer');
        
        if (toggle && drawer) {
          toggle.addEventListener('click', function () {
            if (drawer.classList.contains('is-open')) {
              // Focus first interactive element in drawer
              setTimeout(() => {
                const firstFocusable = drawer.querySelector('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                  firstFocusable.focus();
                }
              }, 100);
            }
          });
        }
      });

      // Enhanced focus visibility
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          document.body.classList.add('using-keyboard');
        }
      });

      document.addEventListener('mousedown', function () {
        document.body.classList.remove('using-keyboard');
      });
    },

    /**
     * Enhanced keyboard navigation.
     */
    initializeKeyboardNavigation: function (context) {
      // Arrow key navigation for menus
      const menus = once('keyboard-nav', '.MuiList-root', context);
      menus.forEach(function (menu) {
        addArrowKeyNavigation(menu);
      });

      // Escape key to close modals and menus
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          // Close mobile menu
          const openMenu = document.querySelector('.MuiMobileMenu-drawer.is-open');
          if (openMenu) {
            const toggle = document.querySelector('.MuiMobileMenu-toggle');
            if (toggle) {
              toggle.click();
              toggle.focus();
            }
          }

          // Close dropdowns
          const openDropdowns = document.querySelectorAll('.dropdown.open, .MuiMenu-root.open');
          openDropdowns.forEach(function (dropdown) {
            dropdown.classList.remove('open');
          });
        }
      });
    },

    /**
     * Screen reader support enhancements.
     */
    initializeScreenReaderSupport: function (context) {
      // Add aria-labels to buttons without text
      const iconButtons = once('icon-button-labels', '.MuiIconButton-root:not([aria-label])', context);
      iconButtons.forEach(function (button) {
        const icon = button.querySelector('svg, i, .icon');
        if (icon && !button.textContent.trim()) {
          button.setAttribute('aria-label', 'Button');
        }
      });

      // Enhance table accessibility
      const tables = once('table-accessibility', 'table', context);
      tables.forEach(function (table) {
        if (!table.querySelector('caption') && !table.getAttribute('aria-label')) {
          const title = table.closest('.field').querySelector('.field__label');
          if (title) {
            table.setAttribute('aria-label', title.textContent);
          }
        }

        // Add scope attributes to headers
        const headers = table.querySelectorAll('th');
        headers.forEach(function (header) {
          if (!header.getAttribute('scope')) {
            header.setAttribute('scope', 'col');
          }
        });
      });

      // Enhance form accessibility
      const formElements = once('form-accessibility', 'input, textarea, select', context);
      formElements.forEach(function (element) {
        const label = element.closest('.form-item').querySelector('label');
        const description = element.closest('.form-item').querySelector('.description');
        
        if (label && !element.getAttribute('aria-labelledby')) {
          const labelId = label.id || 'label-' + Math.random().toString(36).substr(2, 9);
          label.id = labelId;
          element.setAttribute('aria-labelledby', labelId);
        }

        if (description && !element.getAttribute('aria-describedby')) {
          const descId = description.id || 'desc-' + Math.random().toString(36).substr(2, 9);
          description.id = descId;
          element.setAttribute('aria-describedby', descId);
        }
      });
    },

    /**
     * Color contrast detection and adjustments.
     */
    initializeColorContrastDetection: function (context) {
      // Check if user prefers high contrast
      if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast-mode');
      }

      // Monitor contrast preference changes
      if (window.matchMedia) {
        const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
        contrastMediaQuery.addListener(function (e) {
          if (e.matches) {
            document.body.classList.add('high-contrast-mode');
          } else {
            document.body.classList.remove('high-contrast-mode');
          }
        });
      }
    },

    /**
     * Motion preferences detection.
     */
    initializeMotionPreferences: function (context) {
      // Check if user prefers reduced motion
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
      }

      // Monitor motion preference changes
      if (window.matchMedia) {
        const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionMediaQuery.addListener(function (e) {
          if (e.matches) {
            document.body.classList.add('reduced-motion');
          } else {
            document.body.classList.remove('reduced-motion');
          }
        });
      }
    }
  };

  /**
   * Utility function to announce messages to screen readers.
   */
  Drupal.announceForScreenReader = function (message) {
    const liveRegion = document.getElementById('drupal-live-announce');
    if (liveRegion) {
      liveRegion.textContent = message;
      
      // Clear the message after a short delay to allow for repeated announcements
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  };

  /**
   * Trap focus within a modal dialog.
   */
  function trapFocusInModal(modal) {
    const focusableElements = modal.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });

    // Focus first element when modal opens
    firstElement.focus();
  }

  /**
   * Add arrow key navigation to menus.
   */
  function addArrowKeyNavigation(menu) {
    const items = menu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    
    menu.addEventListener('keydown', function (e) {
      const currentIndex = Array.from(items).indexOf(e.target);
      let nextIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) nextIndex = 0;
          items[nextIndex].focus();
          break;

        case 'ArrowUp':
          e.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = items.length - 1;
          items[nextIndex].focus();
          break;

        case 'Home':
          e.preventDefault();
          items[0].focus();
          break;

        case 'End':
          e.preventDefault();
          items[items.length - 1].focus();
          break;
      }
    });
  }

  /**
   * Enhanced error handling for accessibility.
   */
  Drupal.behaviors.muiAccessibilityErrors = {
    attach: function (context, settings) {
      // Announce form errors to screen readers
      const errorMessages = once('error-announcements', '.messages--error', context);
      errorMessages.forEach(function (message) {
        const text = message.textContent || message.innerText;
        if (text) {
          Drupal.announceForScreenReader('Error: ' + text);
        }
      });

      // Focus first error field in forms
      const forms = once('error-focus', 'form', context);
      forms.forEach(function (form) {
        const firstError = form.querySelector('.form-item--error input, .form-item--error textarea, .form-item--error select');
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  };

})(Drupal, once);