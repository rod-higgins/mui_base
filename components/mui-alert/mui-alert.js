/**
 * @file
 * MUI Alert component JavaScript for interactive functionality.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Initialize MUI Alert functionality.
   */
  Drupal.behaviors.muiAlert = {
    attach: function (context, settings) {
      const alerts = once('mui-alert', '.MuiAlert-root', context);
      
      alerts.forEach(function (alert) {
        new MuiAlert(alert);
      });
    }
  };

  /**
   * MUI Alert class.
   */
  function MuiAlert(element) {
    this.element = element;
    this.closeButton = element.querySelector('[data-action="close"]');
    this.actionButtons = element.querySelectorAll('[data-click]');
    this.progressBar = element.querySelector('.MuiAlert-progressBar');
    
    this.autoDismiss = element.dataset.autoDismiss;
    this.dismissTimeout = parseInt(this.autoDismiss) || 5000;
    this.severity = element.dataset.severity || 'info';
    
    this.dismissTimer = null;
    this.isVisible = true;
    
    this.init();
  }

  MuiAlert.prototype = {
    
    /**
     * Initialize alert functionality.
     */
    init: function () {
      this.bindEvents();
      
      // Store instance on element
      this.element.muiAlert = this;
      
      // Start auto-dismiss if enabled
      if (this.autoDismiss) {
        this.startAutoDismiss();
      }
      
      // Apply entrance animation if specified
      this.applyEntranceAnimation();
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
      
      // Action buttons
      this.actionButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
          const handler = button.dataset.click;
          if (typeof window[handler] === 'function') {
            const result = window[handler].call(button, e, self);
            
            // Auto-close unless handler explicitly returns false
            if (result !== false) {
              setTimeout(() => self.close(), 200);
            }
          }
          
          // Dispatch action event
          self.element.dispatchEvent(new CustomEvent('mui:alert:action', {
            bubbles: true,
            detail: { 
              alert: self,
              button: button,
              action: handler
            }
          }));
        });
      });
      
      // Pause auto-dismiss on hover
      if (this.autoDismiss) {
        this.element.addEventListener('mouseenter', function () {
          self.pauseAutoDismiss();
        });
        
        this.element.addEventListener('mouseleave', function () {
          self.resumeAutoDismiss();
        });
      }
      
      // Keyboard accessibility
      this.element.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.closeButton) {
          self.close();
        }
      });
    },

    /**
     * Start auto-dismiss timer.
     */
    startAutoDismiss: function () {
      if (!this.autoDismiss || this.dismissTimer) return;
      
      const self = this;
      
      // Start progress bar animation
      if (this.progressBar) {
        this.progressBar.style.width = '0%';
      }
      
      this.dismissTimer = setTimeout(function () {
        self.close();
      }, this.dismissTimeout);
      
      // Dispatch event
      this.element.dispatchEvent(new CustomEvent('mui:alert:auto-dismiss:started', {
        bubbles: true,
        detail: { 
          alert: this,
          timeout: this.dismissTimeout
        }
      }));
    },

    /**
     * Pause auto-dismiss timer.
     */
    pauseAutoDismiss: function () {
      if (this.dismissTimer) {
        clearTimeout(this.dismissTimer);
        this.dismissTimer = null;
        
        // Pause progress bar
        if (this.progressBar) {
          const computedStyle = window.getComputedStyle(this.progressBar);
          this.progressBar.style.width = computedStyle.width;
          this.progressBar.style.transitionDuration = '0s';
        }
        
        // Dispatch event
        this.element.dispatchEvent(new CustomEvent('mui:alert:auto-dismiss:paused', {
          bubbles: true,
          detail: { alert: this }
        }));
      }
    },

    /**
     * Resume auto-dismiss timer.
     */
    resumeAutoDismiss: function () {
      if (this.autoDismiss && !this.dismissTimer) {
        // Calculate remaining time based on progress bar
        let remainingTime = this.dismissTimeout;
        
        if (this.progressBar) {
          const currentWidth = parseFloat(this.progressBar.style.width) || 100;
          remainingTime = Math.max(1000, this.dismissTimeout * (currentWidth / 100));
          
          // Resume progress bar animation
          this.progressBar.style.transitionDuration = remainingTime + 'ms';
          this.progressBar.style.width = '0%';
        }
        
        const self = this;
        this.dismissTimer = setTimeout(function () {
          self.close();
        }, remainingTime);
        
        // Dispatch event
        this.element.dispatchEvent(new CustomEvent('mui:alert:auto-dismiss:resumed', {
          bubbles: true,
          detail: { 
            alert: this,
            remainingTime: remainingTime
          }
        }));
      }
    },

    /**
     * Close the alert.
     */
    close: function () {
      if (!this.isVisible) return;
      
      this.isVisible = false;
      
      // Clear auto-dismiss timer
      if (this.dismissTimer) {
        clearTimeout(this.dismissTimer);
        this.dismissTimer = null;
      }
      
      // Call external close handler
      const closeHandler = this.element.dataset.onClose;
      if (closeHandler && typeof window[closeHandler] === 'function') {
        const result = window[closeHandler].call(this.element, this);
        if (result === false) {
          this.isVisible = true;
          return;
        }
      }
      
      // Apply exit animation
      this.applyExitAnimation();
      
      // Dispatch close event
      this.element.dispatchEvent(new CustomEvent('mui:alert:close', {
        bubbles: true,
        detail: { alert: this }
      }));
      
      // Remove element after animation
      setTimeout(() => {
        if (this.element.parentNode) {
          this.element.remove();
        }
      }, 300);
    },

    /**
     * Apply entrance animation.
     */
    applyEntranceAnimation: function () {
      const animationClass = this.element.classList.contains('MuiAlert-slideDown') ? 'MuiAlert-slideDown' :
                            this.element.classList.contains('MuiAlert-slideUp') ? 'MuiAlert-slideUp' :
                            this.element.classList.contains('MuiAlert-slideLeft') ? 'MuiAlert-slideLeft' :
                            this.element.classList.contains('MuiAlert-slideRight') ? 'MuiAlert-slideRight' : null;
      
      if (animationClass) {
        // Remove initial animation class after completion
        setTimeout(() => {
          this.element.classList.remove(animationClass);
        }, 300);
      }
    },

    /**
     * Apply exit animation.
     */
    applyExitAnimation: function () {
      this.element.classList.add('MuiAlert-fadeOut');
    },

    /**
     * Show the alert (if hidden).
     */
    show: function () {
      if (this.isVisible) return;
      
      this.isVisible = true;
      this.element.style.display = '';
      this.element.classList.remove('MuiAlert-fadeOut');
      
      // Restart auto-dismiss if enabled
      if (this.autoDismiss) {
        this.startAutoDismiss();
      }
      
      // Dispatch show event
      this.element.dispatchEvent(new CustomEvent('mui:alert:show', {
        bubbles: true,
        detail: { alert: this }
      }));
    },

    /**
     * Hide the alert (without removing from DOM).
     */
    hide: function () {
      if (!this.isVisible) return;
      
      this.isVisible = false;
      
      // Clear auto-dismiss timer
      if (this.dismissTimer) {
        clearTimeout(this.dismissTimer);
        this.dismissTimer = null;
      }
      
      this.applyExitAnimation();
      
      // Hide after animation
      setTimeout(() => {
        this.element.style.display = 'none';
        this.element.classList.remove('MuiAlert-fadeOut');
      }, 300);
      
      // Dispatch hide event
      this.element.dispatchEvent(new CustomEvent('mui:alert:hide', {
        bubbles: true,
        detail: { alert: this }
      }));
    },

    /**
     * Update alert content.
     */
    updateContent: function (title, message) {
      const titleElement = this.element.querySelector('.MuiAlert-title');
      const messageElement = this.element.querySelector('.MuiAlert-message');
      
      if (title && titleElement) {
        titleElement.textContent = title;
      }
      
      if (message && messageElement) {
        messageElement.innerHTML = message;
      }
      
      // Dispatch update event
      this.element.dispatchEvent(new CustomEvent('mui:alert:updated', {
        bubbles: true,
        detail: { 
          alert: this,
          title: title,
          message: message
        }
      }));
    },

    /**
     * Change alert severity.
     */
    changeSeverity: function (newSeverity) {
      const validSeverities = ['error', 'warning', 'info', 'success'];
      if (!validSeverities.includes(newSeverity)) return;
      
      // Remove old severity classes
      validSeverities.forEach(severity => {
        this.element.classList.remove(`MuiAlert-standard${severity.charAt(0).toUpperCase() + severity.slice(1)}`);
        this.element.classList.remove(`MuiAlert-outlined${severity.charAt(0).toUpperCase() + severity.slice(1)}`);
        this.element.classList.remove(`MuiAlert-filled${severity.charAt(0).toUpperCase() + severity.slice(1)}`);
      });
      
      // Add new severity class
      const variant = this.element.classList.contains('MuiAlert-outlined') ? 'outlined' :
                     this.element.classList.contains('MuiAlert-filled') ? 'filled' : 'standard';
      
      this.element.classList.add(`MuiAlert-${variant}${newSeverity.charAt(0).toUpperCase() + newSeverity.slice(1)}`);
      this.element.dataset.severity = newSeverity;
      this.severity = newSeverity;
      
      // Update icon if using default icons
      this.updateIcon();
      
      // Dispatch severity change event
      this.element.dispatchEvent(new CustomEvent('mui:alert:severity:changed', {
        bubbles: true,
        detail: { 
          alert: this,
          newSeverity: newSeverity
        }
      }));
    },

    /**
     * Update severity icon.
     */
    updateIcon: function () {
      const iconContainer = this.element.querySelector('.MuiAlert-icon svg');
      if (!iconContainer) return;
      
      const iconPaths = {
        error: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
        warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
        info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
        success: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
      };
      
      if (iconPaths[this.severity]) {
        iconContainer.querySelector('path').setAttribute('d', iconPaths[this.severity]);
      }
    },

    /**
     * Destroy alert instance.
     */
    destroy: function () {
      if (this.dismissTimer) {
        clearTimeout(this.dismissTimer);
      }
      
      // Remove instance reference
      delete this.element.muiAlert;
    }
  };

  /**
   * Utility functions for creating alerts programmatically.
   */
  Drupal.muiAlert = {
    
    /**
     * Create and show an alert.
     */
    create: function (config = {}) {
      const defaults = {
        severity: 'info',
        variant: 'standard',
        message: '',
        title: '',
        closable: true,
        autoDismiss: false,
        dismissTimeout: 5000
      };
      
      const settings = Object.assign({}, defaults, config);
      
      // Create alert element
      const alertElement = document.createElement('div');
      alertElement.className = `MuiAlert-root MuiAlert-${settings.variant} MuiAlert-${settings.variant}${settings.severity.charAt(0).toUpperCase() + settings.severity.slice(1)}`;
      alertElement.setAttribute('role', settings.severity === 'error' ? 'alert' : 'status');
      alertElement.setAttribute('aria-live', settings.severity === 'error' ? 'assertive' : 'polite');
      alertElement.dataset.severity = settings.severity;
      
      if (settings.autoDismiss) {
        alertElement.dataset.autoDismiss = settings.dismissTimeout;
      }
      
      // Build content
      let content = '<div class="MuiAlert-content">';
      
      // Add icon
      content += '<div class="MuiAlert-icon">';
      // Add appropriate icon based on severity
      content += '</div>';
      
      // Add message content
      content += '<div class="MuiAlert-messageContent">';
      if (settings.title) {
        content += `<div class="MuiAlert-title MuiTypography-subtitle1">${settings.title}</div>`;
      }
      if (settings.message) {
        content += `<div class="MuiAlert-message MuiTypography-body2">${settings.message}</div>`;
      }
      content += '</div>';
      
      // Add close button
      if (settings.closable) {
        content += '<div class="MuiAlert-action"><button type="button" class="MuiAlert-closeButton MuiIconButton-root MuiIconButton-sizeSmall" aria-label="Close" data-action="close">';
        content += '<svg class="MuiAlert-closeIcon MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>';
        content += '</button></div>';
      }
      
      content += '</div>';
      alertElement.innerHTML = content;
      
      // Initialize the alert
      const alertInstance = new MuiAlert(alertElement);
      
      return {
        element: alertElement,
        instance: alertInstance,
        show: function (container) {
          if (container) {
            container.appendChild(alertElement);
          } else {
            document.body.appendChild(alertElement);
          }
          return this;
        },
        close: function () {
          alertInstance.close();
          return this;
        }
      };
    },
    
    /**
     * Show success alert.
     */
    success: function (message, title, options = {}) {
      return this.create(Object.assign({}, options, {
        severity: 'success',
        message: message,
        title: title
      }));
    },
    
    /**
     * Show error alert.
     */
    error: function (message, title, options = {}) {
      return this.create(Object.assign({}, options, {
        severity: 'error',
        message: message,
        title: title
      }));
    },
    
    /**
     * Show warning alert.
     */
    warning: function (message, title, options = {}) {
      return this.create(Object.assign({}, options, {
        severity: 'warning',
        message: message,
        title: title
      }));
    },
    
    /**
     * Show info alert.
     */
    info: function (message, title, options = {}) {
      return this.create(Object.assign({}, options, {
        severity: 'info',
        message: message,
        title: title
      }));
    },
    
    /**
     * Get alert instance from element.
     */
    getInstance: function (element) {
      const alert = element.closest('.MuiAlert-root');
      return alert ? alert.muiAlert : null;
    }
  };

})(Drupal, once);