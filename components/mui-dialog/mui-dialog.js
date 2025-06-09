/**
 * @file
 * MUI Dialog component JavaScript for interactive functionality.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Initialize MUI Dialog functionality.
   */
  Drupal.behaviors.muiDialog = {
    attach: function (context, settings) {
      const dialogs = once('mui-dialog', '.MuiDialog-root', context);
      
      dialogs.forEach(function (dialog) {
        new MuiDialog(dialog);
      });
    }
  };

  /**
   * MUI Dialog class.
   */
  function MuiDialog(element) {
    this.element = element;
    this.paper = element.querySelector('.MuiDialog-paper');
    this.backdrop = element.querySelector('.MuiDialog-backdrop');
    this.container = element.querySelector('.MuiDialog-container');
    this.closeButton = element.querySelector('[data-action="close"]');
    this.submitButton = element.querySelector('[data-action="submit"]');
    this.form = element.querySelector('.MuiDialog-form');
    
    this.isOpen = element.getAttribute('aria-hidden') === 'false';
    this.disableBackdropClick = element.dataset.disableBackdropClick === 'true';
    this.disableEscapeKey = element.dataset.disableEscapeKey === 'true';
    this.autoFocus = element.dataset.autoFocus === 'true';
    this.keepMounted = element.dataset.keepMounted === 'true';
    this.transitionDuration = parseInt(element.dataset.transitionDuration) || 225;
    
    this.focusedElementBeforeOpen = null;
    this.dragData = null;
    this.resizeData = null;
    
    this.init();
  }

  MuiDialog.prototype = {
    
    /**
     * Initialize dialog functionality.
     */
    init: function () {
      this.bindEvents();
      this.initializeDragging();
      this.initializeResizing();
      
      // Store instance on element
      this.element.muiDialog = this;
      
      // Set initial state
      if (this.isOpen) {
        this.handleOpen();
      } else if (!this.keepMounted) {
        this.element.style.display = 'none';
      }
    },

    /**
     * Bind event listeners.
     */
    bindEvents: function () {
      const self = this;
      
      // Close button
      if (this.closeButton) {
        this.closeButton.addEventListener('click', function (e) {
          e.preventDefault();
          self.close();
        });
      }
      
      // Submit button
      if (this.submitButton) {
        this.submitButton.addEventListener('click', function (e) {
          if (self.form) {
            // Let form handle submission
            return;
          }
          e.preventDefault();
          self.close();
        });
      }
      
      // Backdrop click
      if (this.backdrop) {
        this.backdrop.addEventListener('click', function (e) {
          if (!self.disableBackdropClick && e.target === self.backdrop) {
            self.close();
          }
        });
      }
      
      // Container click (for backdrop behavior)
      if (this.container) {
        this.container.addEventListener('click', function (e) {
          if (!self.disableBackdropClick && e.target === self.container) {
            self.close();
          }
        });
      }
      
      // Keyboard events
      document.addEventListener('keydown', function (e) {
        if (self.isOpen && e.key === 'Escape' && !self.disableEscapeKey) {
          e.preventDefault();
          self.close();
        }
      });
      
      // Focus trap
      this.element.addEventListener('keydown', function (e) {
        if (self.isOpen && e.key === 'Tab') {
          self.handleTabKey(e);
        }
      });
      
      // Action button clicks
      const actionButtons = this.element.querySelectorAll('[data-click]');
      actionButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
          const handler = button.dataset.click;
          if (typeof window[handler] === 'function') {
            const result = window[handler].call(button, e, self);
            if (result !== false) {
              self.close();
            }
          }
        });
      });
    },

    /**
     * Open the dialog.
     */
    open: function () {
      if (this.isOpen) return;
      
      this.focusedElementBeforeOpen = document.activeElement;
      this.isOpen = true;
      
      // Show element
      this.element.style.display = '';
      this.element.style.visibility = 'visible';
      this.element.style.opacity = '1';
      this.element.setAttribute('aria-hidden', 'false');
      
      // Handle body scroll
      document.body.style.overflow = 'hidden';
      
      // Trigger open handling
      setTimeout(() => {
        this.handleOpen();
      }, 10);
      
      // Dispatch event
      this.element.dispatchEvent(new CustomEvent('mui:dialog:open', {
        bubbles: true,
        detail: { dialog: this }
      }));
    },

    /**
     * Close the dialog.
     */
    close: function () {
      if (!this.isOpen) return;
      
      this.isOpen = false;
      
      // Hide with animation
      this.element.style.opacity = '0';
      this.element.style.visibility = 'hidden';
      this.element.setAttribute('aria-hidden', 'true');
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus
      if (this.focusedElementBeforeOpen) {
        setTimeout(() => {
          if (this.focusedElementBeforeOpen && this.focusedElementBeforeOpen.focus) {
            this.focusedElementBeforeOpen.focus();
          }
        }, this.transitionDuration);
      }
      
      // Hide element after transition
      if (!this.keepMounted) {
        setTimeout(() => {
          if (!this.isOpen) {
            this.element.style.display = 'none';
          }
        }, this.transitionDuration);
      }
      
      // Dispatch event
      this.element.dispatchEvent(new CustomEvent('mui:dialog:close', {
        bubbles: true,
        detail: { dialog: this }
      }));
    },

    /**
     * Handle dialog opening.
     */
    handleOpen: function () {
      // Auto focus
      if (this.autoFocus) {
        this.focusFirstElement();
      }
      
      // Animate backdrop
      if (this.backdrop) {
        this.backdrop.style.opacity = '1';
      }
      
      // Animate paper
      if (this.paper) {
        this.paper.style.opacity = '1';
        this.paper.style.transform = 'none';
      }
    },

    /**
     * Focus first focusable element.
     */
    focusFirstElement: function () {
      const focusableElements = this.paper.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        // Check for autofocus button first
        const autofocusButton = this.paper.querySelector('[autofocus]');
        if (autofocusButton) {
          autofocusButton.focus();
        } else {
          focusableElements[0].focus();
        }
      } else {
        // Focus the paper itself
        this.paper.focus();
      }
    },

    /**
     * Handle tab key for focus trapping.
     */
    handleTabKey: function (e) {
      const focusableElements = this.paper.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },

    /**
     * Initialize drag functionality.
     */
    initializeDragging: function () {
      if (!this.element.classList.contains('MuiDialog-draggable')) return;
      
      const handle = this.element.querySelector('.MuiDialog-draggableHandle');
      if (!handle) return;
      
      const self = this;
      
      handle.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        
        e.preventDefault();
        
        const rect = self.paper.getBoundingClientRect();
        self.dragData = {
          startX: e.clientX,
          startY: e.clientY,
          initialLeft: rect.left,
          initialTop: rect.top
        };
        
        document.addEventListener('mousemove', self.handleDragMove.bind(self));
        document.addEventListener('mouseup', self.handleDragEnd.bind(self));
        
        handle.style.cursor = 'grabbing';
      });
    },

    /**
     * Handle drag move.
     */
    handleDragMove: function (e) {
      if (!this.dragData) return;
      
      const deltaX = e.clientX - this.dragData.startX;
      const deltaY = e.clientY - this.dragData.startY;
      
      const newLeft = this.dragData.initialLeft + deltaX;
      const newTop = this.dragData.initialTop + deltaY;
      
      // Keep dialog within viewport
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const paperRect = this.paper.getBoundingClientRect();
      const constrainedLeft = Math.max(0, Math.min(newLeft, viewport.width - paperRect.width));
      const constrainedTop = Math.max(0, Math.min(newTop, viewport.height - paperRect.height));
      
      this.paper.style.position = 'fixed';
      this.paper.style.left = constrainedLeft + 'px';
      this.paper.style.top = constrainedTop + 'px';
      this.paper.style.margin = '0';
    },

    /**
     * Handle drag end.
     */
    handleDragEnd: function () {
      document.removeEventListener('mousemove', this.handleDragMove.bind(this));
      document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
      
      const handle = this.element.querySelector('.MuiDialog-draggableHandle');
      if (handle) {
        handle.style.cursor = 'move';
      }
      
      this.dragData = null;
    },

    /**
     * Initialize resize functionality.
     */
    initializeResizing: function () {
      if (!this.element.classList.contains('MuiDialog-resizable')) return;
      
      const handles = this.element.querySelectorAll('.MuiDialog-resizeHandle');
      if (handles.length === 0) return;
      
      const self = this;
      
      handles.forEach(function (handle) {
        handle.addEventListener('mousedown', function (e) {
          if (e.button !== 0) return;
          
          e.preventDefault();
          e.stopPropagation();
          
          const rect = self.paper.getBoundingClientRect();
          const handleClass = Array.from(handle.classList).find(cls => 
            cls.startsWith('MuiDialog-resizeHandle-')
          );
          const direction = handleClass.split('-').pop();
          
          self.resizeData = {
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: rect.width,
            initialHeight: rect.height,
            initialLeft: rect.left,
            initialTop: rect.top,
            direction: direction
          };
          
          document.addEventListener('mousemove', self.handleResizeMove.bind(self));
          document.addEventListener('mouseup', self.handleResizeEnd.bind(self));
        });
      });
    },

    /**
     * Handle resize move.
     */
    handleResizeMove: function (e) {
      if (!this.resizeData) return;
      
      const deltaX = e.clientX - this.resizeData.startX;
      const deltaY = e.clientY - this.resizeData.startY;
      const direction = this.resizeData.direction;
      
      let newWidth = this.resizeData.initialWidth;
      let newHeight = this.resizeData.initialHeight;
      let newLeft = this.resizeData.initialLeft;
      let newTop = this.resizeData.initialTop;
      
      // Calculate new dimensions based on direction
      if (direction.includes('e')) {
        newWidth = Math.max(280, this.resizeData.initialWidth + deltaX);
      }
      if (direction.includes('w')) {
        newWidth = Math.max(280, this.resizeData.initialWidth - deltaX);
        newLeft = this.resizeData.initialLeft + deltaX;
      }
      if (direction.includes('s')) {
        newHeight = Math.max(200, this.resizeData.initialHeight + deltaY);
      }
      if (direction.includes('n')) {
        newHeight = Math.max(200, this.resizeData.initialHeight - deltaY);
        newTop = this.resizeData.initialTop + deltaY;
      }
      
      // Apply constraints
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      newWidth = Math.min(newWidth, viewport.width - 40);
      newHeight = Math.min(newHeight, viewport.height - 40);
      
      // Apply styles
      this.paper.style.width = newWidth + 'px';
      this.paper.style.height = newHeight + 'px';
      this.paper.style.maxWidth = newWidth + 'px';
      this.paper.style.maxHeight = newHeight + 'px';
      
      if (direction.includes('w') || direction.includes('n')) {
        this.paper.style.position = 'fixed';
        this.paper.style.left = newLeft + 'px';
        this.paper.style.top = newTop + 'px';
        this.paper.style.margin = '0';
      }
    },

    /**
     * Handle resize end.
     */
    handleResizeEnd: function () {
      document.removeEventListener('mousemove', this.handleResizeMove.bind(this));
      document.removeEventListener('mouseup', this.handleResizeEnd.bind(this));
      
      this.resizeData = null;
    },

    /**
     * Toggle dialog state.
     */
    toggle: function () {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    /**
     * Destroy dialog instance.
     */
    destroy: function () {
      this.close();
      
      // Remove event listeners
      // Note: Modern browsers handle this automatically when element is removed
      
      // Remove instance reference
      delete this.element.muiDialog;
    }
  };

  /**
   * Utility functions for creating dialogs programmatically.
   */
  Drupal.muiDialog = {
    
    /**
     * Create and show a simple alert dialog.
     */
    alert: function (message, title, severity) {
      return this.create({
        dialog_type: 'alert',
        title: title || 'Alert',
        content: message,
        alert_severity: severity || 'info',
        open: true
      });
    },

    /**
     * Create and show a confirmation dialog.
     */
    confirm: function (message, title, options) {
      options = options || {};
      
      return new Promise((resolve) => {
        const dialog = this.create({
          dialog_type: 'confirmation',
          title: title || 'Confirm',
          content: message,
          confirmation_danger: options.danger || false,
          open: true,
          actions: [
            {
              label: options.cancelLabel || 'Cancel',
              variant: 'text',
              color: 'inherit',
              click_handler: () => {
                dialog.close();
                resolve(false);
              }
            },
            {
              label: options.confirmLabel || 'Confirm',
              variant: 'contained',
              color: options.danger ? 'error' : 'primary',
              click_handler: () => {
                dialog.close();
                resolve(true);
              }
            }
          ]
        });
      });
    },

    /**
     * Create and show a loading dialog.
     */
    loading: function (message) {
      return this.create({
        dialog_type: 'loading',
        content: message || 'Loading...',
        open: true
      });
    },

    /**
     * Create a dialog from configuration.
     */
    create: function (config) {
      // This would create a dialog element and initialize it
      // Implementation would depend on how the component is integrated
      console.log('Creating dialog with config:', config);
      
      // Return a mock dialog object for now
      return {
        open: () => console.log('Dialog opened'),
        close: () => console.log('Dialog closed'),
        toggle: () => console.log('Dialog toggled')
      };
    },

    /**
     * Get dialog instance from element.
     */
    getInstance: function (element) {
      const dialog = element.closest('.MuiDialog-root');
      return dialog ? dialog.muiDialog : null;
    }
  };

})(Drupal, once);