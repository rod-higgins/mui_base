/**
 * @file
 * MUI Base theme JavaScript - Improved with modern practices and performance.
 */

(function (Drupal, once) {
  'use strict';

  // Constants for better maintainability
  const SELECTORS = {
    focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    rippleElements: '.MuiButton-root, .MuiListItemButton-root',
    inputFields: '.MuiInputBase-input',
    mobileMenu: '.MuiMobileMenu-root',
    sidebarMenu: '.MuiSidebarMenu-root.MuiSidebarMenu-collapsible',
    iconButtons: '.MuiIconButton-root:not([aria-label])',
    formElements: 'input, textarea, select'
  };

  const BREAKPOINTS = {
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536
  };

  const CLASSES = {
    focusVisible: 'mui-focus-visible',
    usingKeyboard: 'using-keyboard',
    rippleRoot: 'MuiTouchRipple-root',
    rippleVisible: 'MuiTouchRipple-ripple MuiTouchRipple-rippleVisible',
    menuOpen: 'is-open',
    menuExpanded: 'is-expanded',
    disabled: 'Mui-disabled',
    visuallyHidden: 'visually-hidden'
  };

  // Utility functions
  const Utils = {
    /**
     * Debounce function calls to improve performance.
     */
    debounce(func, wait, immediate = false) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          timeout = null;
          if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
      };
    },

    /**
     * Get computed style property value.
     */
    getStyleProperty(element, property) {
      return window.getComputedStyle(element).getPropertyValue(property);
    },

    /**
     * Check if user prefers reduced motion.
     */
    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Announce message to screen readers.
     */
    announce(message) {
      const liveRegion = document.getElementById('drupal-live-announce');
      if (liveRegion && message) {
        liveRegion.textContent = message;
        // Clear after announcement
        setTimeout(() => {
          if (liveRegion.textContent === message) {
            liveRegion.textContent = '';
          }
        }, 1000);
      }
    },

    /**
     * Create optimized event listener with cleanup.
     */
    addListener(element, event, handler, options = {}) {
      if (element && typeof handler === 'function') {
        element.addEventListener(event, handler, options);
        // Return cleanup function
        return () => element.removeEventListener(event, handler, options);
      }
      return () => {};
    }
  };

  /**
   * Enhanced Focus Management System.
   */
  const FocusManager = {
    init(context) {
      this.setupKeyboardDetection();
      this.enhanceFocusVisibility(context);
    },

    setupKeyboardDetection() {
      // Track keyboard vs mouse usage for better focus management
      const keydownHandler = (e) => {
        if (e.key === 'Tab') {
          document.body.classList.add(CLASSES.usingKeyboard);
        }
      };

      const mousedownHandler = () => {
        document.body.classList.remove(CLASSES.usingKeyboard);
      };

      // Use passive listeners for better performance
      document.addEventListener('keydown', keydownHandler, { passive: true });
      document.addEventListener('mousedown', mousedownHandler, { passive: true });
    },

    enhanceFocusVisibility(context) {
      const focusableElements = once('focus-management', SELECTORS.focusable, context);
      
      focusableElements.forEach(element => {
        const keydownHandler = (e) => {
          if (e.key === 'Tab') {
            element.classList.add(CLASSES.focusVisible);
          }
        };

        const blurHandler = () => {
          element.classList.remove(CLASSES.focusVisible);
        };

        const mousedownHandler = () => {
          element.classList.remove(CLASSES.focusVisible);
        };

        Utils.addListener(element, 'keydown', keydownHandler, { passive: true });
        Utils.addListener(element, 'blur', blurHandler, { passive: true });
        Utils.addListener(element, 'mousedown', mousedownHandler, { passive: true });
      });
    }
  };

  /**
   * Ripple Effect System with performance optimizations.
   */
  const RippleManager = {
    init(context) {
      const rippleElements = once('ripple-effects', SELECTORS.rippleElements, context);
      
      rippleElements.forEach(element => {
        if (element.classList.contains(CLASSES.disabled) || 
            element.querySelector(`.${CLASSES.rippleRoot}`)) {
          return;
        }
        
        this.setupRippleContainer(element);
      });
    },

    setupRippleContainer(element) {
      const rippleContainer = document.createElement('span');
      rippleContainer.className = CLASSES.rippleRoot;
      element.appendChild(rippleContainer);
      
      // Optimize event listeners
      const clickHandler = (e) => {
        if (!element.classList.contains(CLASSES.disabled)) {
          this.createRipple(e, rippleContainer);
        }
      };

      const keydownHandler = (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && 
            !element.classList.contains(CLASSES.disabled)) {
          this.createRipple(e, rippleContainer, true);
        }
      };

      Utils.addListener(element, 'click', clickHandler, { passive: true });
      Utils.addListener(element, 'keydown', keydownHandler, { passive: true });
    },

    createRipple(event, rippleContainer, center = false) {
      if (Utils.prefersReducedMotion()) {
        return; // Skip animations if user prefers reduced motion
      }

      const button = rippleContainer.parentNode;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      let x, y;
      
      if (center || !event.clientX || !event.clientY) {
        x = rect.width / 2 - size / 2;
        y = rect.height / 2 - size / 2;
      } else {
        x = event.clientX - rect.left - size / 2;
        y = event.clientY - rect.top - size / 2;
      }
      
      const ripple = document.createElement('span');
      ripple.className = CLASSES.rippleVisible;
      
      // Use CSS transforms for better performance
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background-color: currentColor;
        pointer-events: none;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        opacity: 0.3;
        transform: scale(0);
        animation: mui-ripple-enter 550ms cubic-bezier(0.4, 0, 0.2, 1);
      `;
      
      rippleContainer.appendChild(ripple);
      
      // Clean up after animation with fallback
      const cleanup = () => {
        if (ripple.parentNode) {
          ripple.remove();
        }
      };
      
      // Use both timeout and animation event for reliability
      setTimeout(cleanup, 600);
      ripple.addEventListener('animationend', cleanup, { once: true });
    }
  };

  /**
   * Enhanced Form System.
   */
  const FormManager = {
    init(context) {
      this.enhanceInputs(context);
      this.addFormValidation(context);
    },

    enhanceInputs(context) {
      const inputFields = once('form-enhancements', SELECTORS.inputFields, context);
      
      inputFields.forEach(input => {
        const formControl = input.closest('.MuiFormControl-root') || 
                           input.closest('.form-item');
        
        if (formControl) {
          this.setupFloatingLabel(input, formControl);
        }
      });
    },

    setupFloatingLabel(input, formControl) {
      const updateLabel = () => {
        const hasValue = input.value.length > 0;
        const isFocused = input === document.activeElement;
        
        formControl.classList.toggle('MuiFormControl-focused', hasValue || isFocused);
      };
      
      // Use optimized event listeners
      Utils.addListener(input, 'focus', updateLabel, { passive: true });
      Utils.addListener(input, 'blur', updateLabel, { passive: true });
      Utils.addListener(input, 'input', updateLabel, { passive: true });
      
      // Set initial state
      updateLabel();
    },

    addFormValidation(context) {
      const forms = once('form-validation', 'form', context);
      
      forms.forEach(form => {
        const submitHandler = (e) => {
          const invalidInputs = form.querySelectorAll(':invalid');
          if (invalidInputs.length > 0) {
            Utils.announce(`Form has ${invalidInputs.length} validation error(s). Please check your input.`);
            // Focus first invalid input
            invalidInputs[0].focus();
          }
        };
        
        Utils.addListener(form, 'submit', submitHandler, { passive: true });
      });
    }
  };

  /**
   * Mobile Menu System with improved performance.
   */
  const MobileMenuManager = {
    init(context) {
      const menus = once('mobile-menu', SELECTORS.mobileMenu, context);
      
      menus.forEach(menu => {
        this.setupMenu(menu);
      });
    },

    setupMenu(menu) {
      const elements = this.getMenuElements(menu);
      if (!elements.toggle || !elements.drawer) return;
      
      const state = { isOpen: false, focusedElementBeforeTrap: null };
      
      // Setup event listeners with proper cleanup
      this.setupToggleListener(elements, state);
      this.setupCloseListeners(elements, state);
      this.setupSubmenuListeners(elements);
      this.setupResizeListener(menu, elements, state);
      this.setupKeyboardListeners(elements, state);
    },

    getMenuElements(menu) {
      return {
        toggle: menu.querySelector('.MuiMobileMenu-toggle'),
        drawer: menu.querySelector('.MuiMobileMenu-drawer'),
        backdrop: menu.querySelector('.MuiMobileMenu-backdrop'),
        closeButton: menu.querySelector('.MuiMobileMenu-closeButton'),
        expandButtons: menu.querySelectorAll('.MuiMobileMenu-expandButton')
      };
    },

    setupToggleListener(elements, state) {
      const toggleHandler = () => {
        if (state.isOpen) {
          this.closeMenu(elements, state);
        } else {
          this.openMenu(elements, state);
        }
      };
      
      Utils.addListener(elements.toggle, 'click', toggleHandler);
    },

    setupCloseListeners(elements, state) {
      if (elements.closeButton) {
        Utils.addListener(elements.closeButton, 'click', () => {
          this.closeMenu(elements, state);
        });
      }
      
      if (elements.backdrop) {
        Utils.addListener(elements.backdrop, 'click', () => {
          this.closeMenu(elements, state);
        });
      }
    },

    setupSubmenuListeners(elements) {
      elements.expandButtons.forEach(button => {
        const submenu = button.closest('.MuiMobileMenu-listItem')
                             .querySelector('.MuiMobileMenu-submenu');
        
        if (submenu) {
          const clickHandler = () => {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
              this.collapseSubmenu(button, submenu);
            } else {
              this.expandSubmenu(button, submenu);
            }
          };
          
          Utils.addListener(button, 'click', clickHandler);
        }
      });
    },

    setupResizeListener(menu, elements, state) {
      const resizeHandler = Utils.debounce(() => {
        const breakpoint = menu.dataset.breakpoint || 'md';
        const breakpointWidth = BREAKPOINTS[breakpoint];
        
        if (window.innerWidth >= breakpointWidth && state.isOpen) {
          this.closeMenu(elements, state);
        }
      }, 250);
      
      Utils.addListener(window, 'resize', resizeHandler, { passive: true });
    },

    setupKeyboardListeners(elements, state) {
      const keydownHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeMenu(elements, state);
          elements.toggle.focus();
        }
      };
      
      Utils.addListener(elements.drawer, 'keydown', keydownHandler);
    },

    openMenu(elements, state) {
      state.isOpen = true;
      state.focusedElementBeforeTrap = document.activeElement;
      
      elements.drawer.classList.add(CLASSES.menuOpen);
      elements.toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      
      // Improved focus management
      const focusFirstElement = () => {
        const firstFocusable = elements.drawer.querySelector(SELECTORS.focusable);
        if (firstFocusable) {
          firstFocusable.focus();
        }
      };
      
      if (Utils.prefersReducedMotion()) {
        focusFirstElement();
      } else {
        setTimeout(focusFirstElement, 100);
      }
      
      this.setupFocusTrap(elements.drawer);
      Utils.announce('Navigation menu opened');
    },

    closeMenu(elements, state) {
      state.isOpen = false;
      
      elements.drawer.classList.remove(CLASSES.menuOpen);
      elements.toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      
      this.removeFocusTrap(elements.drawer);
      
      if (state.focusedElementBeforeTrap) {
        state.focusedElementBeforeTrap.focus();
      }
      
      Utils.announce('Navigation menu closed');
    },

    expandSubmenu(button, submenu) {
      button.setAttribute('aria-expanded', 'true');
      submenu.classList.add(CLASSES.menuExpanded);
      
      const content = submenu.querySelector('.MuiMobileMenu-submenuList');
      if (content && !Utils.prefersReducedMotion()) {
        submenu.style.maxHeight = content.scrollHeight + 'px';
        setTimeout(() => {
          if (submenu.classList.contains(CLASSES.menuExpanded)) {
            submenu.style.maxHeight = '';
          }
        }, 300);
      }
    },

    collapseSubmenu(button, submenu) {
      button.setAttribute('aria-expanded', 'false');
      submenu.classList.remove(CLASSES.menuExpanded);
      if (!Utils.prefersReducedMotion()) {
        submenu.style.maxHeight = '0';
      }
    },

    setupFocusTrap(element) {
      const focusableElements = element.querySelectorAll(SELECTORS.focusable);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const trapHandler = (e) => {
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
      };

      element._focusTrapHandler = trapHandler;
      Utils.addListener(element, 'keydown', trapHandler);
    },

    removeFocusTrap(element) {
      if (element._focusTrapHandler) {
        element.removeEventListener('keydown', element._focusTrapHandler);
        delete element._focusTrapHandler;
      }
    }
  };

  /**
   * Accessibility Enhancement System.
   */
  const AccessibilityManager = {
    init(context) {
      this.createLiveRegion();
      this.enhanceButtonLabels(context);
      this.enhanceFormAccessibility(context);
      this.setupErrorAnnouncements(context);
    },

    createLiveRegion() {
      if (!document.getElementById('drupal-live-announce')) {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'drupal-live-announce';
        liveRegion.className = CLASSES.visuallyHidden;
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
      }
    },

    enhanceButtonLabels(context) {
      const iconButtons = once('icon-button-labels', SELECTORS.iconButtons, context);
      iconButtons.forEach(button => {
        if (!button.textContent.trim()) {
          button.setAttribute('aria-label', 'Button');
        }
      });
    },

    enhanceFormAccessibility(context) {
      const formElements = once('form-accessibility', SELECTORS.formElements, context);
      formElements.forEach(element => {
        const formItem = element.closest('.form-item');
        if (!formItem) return;
        
        this.linkLabelAndDescription(element, formItem);
      });
    },

    linkLabelAndDescription(element, formItem) {
      const label = formItem.querySelector('label');
      const description = formItem.querySelector('.description');
      
      if (label && !element.getAttribute('aria-labelledby')) {
        const labelId = label.id || `label-${Math.random().toString(36).substr(2, 9)}`;
        label.id = labelId;
        element.setAttribute('aria-labelledby', labelId);
      }
      
      if (description && !element.getAttribute('aria-describedby')) {
        const descId = description.id || `desc-${Math.random().toString(36).substr(2, 9)}`;
        description.id = descId;
        element.setAttribute('aria-describedby', descId);
      }
    },

    setupErrorAnnouncements(context) {
      // Monitor form submissions
      const forms = once('form-announcements', 'form', context);
      forms.forEach(form => {
        const submitHandler = () => {
          Utils.announce('Form submitted. Please wait for confirmation.');
        };
        Utils.addListener(form, 'submit', submitHandler, { passive: true });
      });

      // Announce error messages
      const errorMessages = once('error-announcements', '.messages--error', context);
      errorMessages.forEach(message => {
        const text = message.textContent || message.innerText;
        if (text) {
          Utils.announce(`Error: ${text}`);
        }
      });
    }
  };

  /**
   * Main MUI Base behavior - consolidates all functionality.
   */
  Drupal.behaviors.muiBase = {
    attach(context, settings) {
      // Initialize all systems with error handling
      try {
        FocusManager.init(context);
        RippleManager.init(context);
        FormManager.init(context);
        MobileMenuManager.init(context);
        AccessibilityManager.init(context);
      } catch (error) {
        console.error('MUI Base initialization error:', error);
        // Log to Drupal if available
        if (Drupal.ajax) {
          Drupal.ajax({
            url: '/admin/reports/dblog',
            submit: { message: `MUI Base JS Error: ${error.message}` }
          });
        }
      }
    }
  };

  /**
   * Global MUI utility functions with improved API.
   */
  Drupal.mui = {
    /**
     * Announce message to screen readers.
     */
    announce: Utils.announce,

    /**
     * Create ripple effect.
     */
    createRipple: RippleManager.createRipple.bind(RippleManager),

    /**
     * Show enhanced snackbar notification.
     */
    showSnackbar(message, options = {}) {
      const defaults = {
        duration: 4000,
        action: null,
        position: 'bottom-left',
        variant: 'info'
      };
      
      const settings = { ...defaults, ...options };
      
      const snackbar = document.createElement('div');
      snackbar.className = `MuiSnackbar-root MuiSnackbar-${settings.position} MuiSnackbar-${settings.variant}`;
      snackbar.setAttribute('role', 'alert');
      snackbar.setAttribute('aria-live', 'assertive');
      
      snackbar.innerHTML = `
        <div class="MuiSnackbarContent-root">
          <div class="MuiSnackbarContent-message">${message}</div>
          ${settings.action ? `<div class="MuiSnackbarContent-action">${settings.action}</div>` : ''}
          <button class="MuiSnackbarContent-close" aria-label="Close notification" type="button">×</button>
        </div>
      `;
      
      document.body.appendChild(snackbar);
      
      // Enhanced animations with reduced motion support
      const animateIn = () => {
        snackbar.classList.add('MuiSnackbar-enter');
      };
      
      const animateOut = () => {
        snackbar.classList.add('MuiSnackbar-exit');
        setTimeout(() => {
          if (snackbar.parentNode) {
            snackbar.remove();
          }
        }, Utils.prefersReducedMotion() ? 0 : 300);
      };
      
      if (Utils.prefersReducedMotion()) {
        animateIn();
      } else {
        requestAnimationFrame(animateIn);
      }
      
      // Close button handler
      const closeButton = snackbar.querySelector('.MuiSnackbarContent-close');
      if (closeButton) {
        Utils.addListener(closeButton, 'click', animateOut);
      }
      
      // Auto remove
      if (settings.duration > 0) {
        setTimeout(animateOut, settings.duration);
      }
      
      // Announce to screen readers
      Utils.announce(message);
      
      return {
        element: snackbar,
        close: animateOut
      };
    },

    /**
     * Utilities object for external use.
     */
    utils: Utils
  };

  // Add global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Skip link activation
    if (e.key === 'Tab' && !e.shiftKey && e.target === document.body) {
      const skipLink = document.querySelector('.skip-link');
      if (skipLink) {
        skipLink.focus();
      }
    }
  }, { passive: true });

})(Drupal, once);