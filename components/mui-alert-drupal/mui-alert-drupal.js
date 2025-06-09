/**
 * @file
 * MUI Alert Drupal Integration JavaScript.
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * Initialize MUI Alert Drupal integration functionality.
   */
  Drupal.behaviors.muiAlertDrupal = {
    attach: function (context, settings) {
      const alertContainers = once('mui-alert-drupal', '.mui-alert-drupal', context);
      
      alertContainers.forEach(function (container) {
        new MuiAlertDrupal(container);
      });
    }
  };

  /**
   * MUI Alert Drupal class for enhanced Drupal integration.
   */
  function MuiAlertDrupal(element) {
    this.element = element;
    this.config = this.loadConfig();
    this.messageQueue = [];
    this.activeAlerts = new Map();
    this.alertTemplate = document.getElementById('mui-alert-template');
    this.isProcessing = false;
    
    this.init();
  }

  MuiAlertDrupal.prototype = {
    
    /**
     * Initialize Drupal-specific functionality.
     */
    init: function () {
      this.setupDrupalIntegration();
      this.setupFormErrorHandling();
      this.setupAjaxIntegration();
      this.processExistingMessages();
      
      // Store instance on element
      this.element.muiAlertDrupal = this;
      
      // Initialize message announcement for accessibility
      if (this.config.announceMessages) {
        this.setupAccessibilityAnnouncements();
      }
    },

    /**
     * Load configuration from JSON script tag.
     */
    loadConfig: function () {
      const configScript = this.element.querySelector('.mui-alert-drupal-config');
      if (configScript) {
        try {
          return JSON.parse(configScript.textContent);
        } catch (e) {
          console.error('Error parsing MUI Alert Drupal config:', e);
        }
      }
      
      // Fallback default config
      return {
        maxAlerts: 5,
        queueBehavior: 'fifo',
        position: 'top-right',
        autoDismiss: true,
        dismissTimeout: { success: 5000, info: 7000, warning: 10000, error: 0 },
        handleMessenger: true,
        handleFormErrors: true,
        ajaxSupport: true,
        announceMessages: true
      };
    },

    /**
     * Setup Drupal messenger service integration.
     */
    setupDrupalIntegration: function () {
      const self = this;
      
      if (!this.config.handleMessenger) {
        return;
      }
      
      // Listen for new Drupal messages
      document.addEventListener('drupal:messenger:message', function (e) {
        self.addMessage(e.detail.type, e.detail.message, e.detail.options || {});
      });
      
      // Hide original Drupal messages if configured
      if (this.config.replaceDrupalMessages) {
        this.hideOriginalMessages();
      }
      
      // Process existing messages from Drupal's messenger service
      this.processDrupalMessages();
    },

    /**
     * Setup form error handling.
     */
    setupFormErrorHandling: function () {
      const self = this;
      
      if (!this.config.handleFormErrors) {
        return;
      }
      
      // Listen for form submission errors
      document.addEventListener('submit', function (e) {
        const form = e.target;
        if (form.tagName === 'FORM') {
          // Clear existing form error alerts
          self.clearFormErrorAlerts();
          
          // Wait for form validation
          setTimeout(() => {
            self.processFormErrors(form);
          }, 100);
        }
      });
      
      // Listen for real-time validation errors
      document.addEventListener('invalid', function (e) {
        const field = e.target;
        if (field.form) {
          setTimeout(() => {
            self.processFieldError(field);
          }, 50);
        }
      }, true);
    },

    /**
     * Setup AJAX integration.
     */
    setupAjaxIntegration: function () {
      const self = this;
      
      if (!this.config.ajaxSupport) {
        return;
      }
      
      // Listen for AJAX form submissions
      document.addEventListener('drupal:ajax:beforeSend', function (e) {
        self.showLoadingState();
      });
      
      // Listen for AJAX responses
      document.addEventListener('drupal:ajax:complete', function (e) {
        self.hideLoadingState();
        
        if (e.detail && e.detail.response) {
          self.processAjaxResponse(e.detail.response);
        }
      });
      
      // Listen for AJAX errors
      document.addEventListener('drupal:ajax:error', function (e) {
        self.hideLoadingState();
        self.addMessage('error', Drupal.t('An error occurred while processing your request.'), {
          autoDismiss: false
        });
      });
    },

    /**
     * Process existing messages on page load.
     */
    processExistingMessages: function () {
      // Process any server-side generated alerts that are already in the DOM
      const existingAlerts = this.element.querySelectorAll('.MuiAlert-root');
      existingAlerts.forEach(alert => {
        this.registerExistingAlert(alert);
      });
    },

    /**
     * Process Drupal messages from the messenger service.
     */
    processDrupalMessages: function () {
      if (typeof drupalSettings !== 'undefined' && 
          drupalSettings.muiAlertDrupal && 
          drupalSettings.muiAlertDrupal.messages) {
        
        const messages = drupalSettings.muiAlertDrupal.messages;
        Object.keys(messages).forEach(type => {
          if (this.config.messageTypes.includes(type)) {
            messages[type].forEach(message => {
              this.addMessage(type, message);
            });
          }
        });
      }
    },

    /**
     * Add a new message to the alert system.
     */
    addMessage: function (type, message, options = {}) {
      const severity = this.config.severityMapping[type] || type;
      const alertData = {
        id: this.generateAlertId(),
        severity: severity,
        originalType: type,
        message: message,
        title: options.title || null,
        autoDismiss: options.autoDismiss !== undefined ? options.autoDismiss : this.config.autoDismiss,
        dismissTimeout: options.dismissTimeout || this.config.dismissTimeout[severity] || 5000,
        timestamp: Date.now(),
        ...options
      };
      
      // Apply message transformation if configured
      if (this.config.messageTransformCallback && 
          typeof window[this.config.messageTransformCallback] === 'function') {
        alertData.message = window[this.config.messageTransformCallback](alertData.message, alertData);
      }
      
      // Apply severity transformation if configured
      if (this.config.severityTransformCallback && 
          typeof window[this.config.severityTransformCallback] === 'function') {
        alertData.severity = window[this.config.severityTransformCallback](alertData.severity, alertData);
      }
      
      // Check for similar messages to group
      if (this.config.groupSimilar) {
        const similar = this.findSimilarMessage(alertData);
        if (similar) {
          this.groupWithSimilar(similar, alertData);
          return;
        }
      }
      
      // Add to queue
      this.messageQueue.push(alertData);
      this.processQueue();
      
      // Announce for accessibility
      if (this.config.announceMessages) {
        this.announceMessage(alertData);
      }
      
      // Call custom handler
      if (this.config.onMessageAdd && typeof window[this.config.onMessageAdd] === 'function') {
        window[this.config.onMessageAdd](alertData, this);
      }
      
      // Dispatch custom event
      this.element.dispatchEvent(new CustomEvent('mui:alert:added', {
        bubbles: true,
        detail: { alert: alertData, container: this }
      }));
    },

    /**
     * Process the message queue.
     */
    processQueue: function () {
      if (this.isProcessing) {
        return;
      }
      
      this.isProcessing = true;
      
      while (this.messageQueue.length > 0 && this.activeAlerts.size < this.config.maxAlerts) {
        let alertData;
        
        switch (this.config.queueBehavior) {
          case 'lifo':
            alertData = this.messageQueue.pop();
            break;
          case 'priority':
            alertData = this.getHighestPriorityMessage();
            break;
          default: // fifo
            alertData = this.messageQueue.shift();
        }
        
        if (alertData) {
          this.createAlert(alertData);
        }
      }
      
      // Update overflow indicator
      this.updateOverflowIndicator();
      
      this.isProcessing = false;
    },

    /**
     * Create a new alert element.
     */
    createAlert: function (alertData) {
      if (!this.alertTemplate) {
        console.error('Alert template not found');
        return;
      }
      
      // Clone template
      const alertElement = this.alertTemplate.content.cloneNode(true).firstElementChild;
      
      // Customize alert
      this.customizeAlert(alertElement, alertData);
      
      // Add to DOM
      this.element.appendChild(alertElement);
      
      // Store reference
      this.activeAlerts.set(alertData.id, {
        element: alertElement,
        data: alertData
      });
      
      // Setup alert behaviors
      this.setupAlertBehaviors(alertElement, alertData);
      
      // Trigger entrance animation
      requestAnimationFrame(() => {
        alertElement.classList.add('mui-alert-entering');
      });
    },

    /**
     * Customize alert element with data.
     */
    customizeAlert: function (alertElement, alertData) {
      // Update content
      const messageElement = alertElement.querySelector('.MuiAlert-message');
      if (messageElement) {
        if (this.config.allowHtml && !this.config.sanitizeHtml) {
          messageElement.innerHTML = alertData.message;
        } else if (this.config.allowHtml && this.config.sanitizeHtml) {
          messageElement.innerHTML = this.sanitizeHtml(alertData.message);
        } else {
          messageElement.textContent = alertData.message;
        }
        
        // Process links if enabled
        if (this.config.linkDetection) {
          this.processLinks(messageElement);
        }
      }
      
      // Update title
      const titleElement = alertElement.querySelector('.MuiAlert-title');
      if (titleElement && alertData.title) {
        titleElement.textContent = alertData.title;
        titleElement.style.display = '';
      } else if (titleElement) {
        titleElement.style.display = 'none';
      }
      
      // Update severity classes
      alertElement.classList.remove('MuiAlert-standardInfo', 'MuiAlert-standardSuccess', 'MuiAlert-standardWarning', 'MuiAlert-standardError');
      alertElement.classList.remove('MuiAlert-filledInfo', 'MuiAlert-filledSuccess', 'MuiAlert-filledWarning', 'MuiAlert-filledError');
      alertElement.classList.remove('MuiAlert-outlinedInfo', 'MuiAlert-outlinedSuccess', 'MuiAlert-outlinedWarning', 'MuiAlert-outlinedError');
      
      const severityClass = `MuiAlert-${this.config.variant || 'standard'}${alertData.severity.charAt(0).toUpperCase() + alertData.severity.slice(1)}`;
      alertElement.classList.add(severityClass);
      
      // Set data attributes
      alertElement.dataset.alertId = alertData.id;
      alertElement.dataset.alertSeverity = alertData.severity;
      alertElement.dataset.drupalMessageType = alertData.originalType;
      alertElement.dataset.timestamp = alertData.timestamp;
      
      // Configure auto-dismiss
      if (alertData.autoDismiss && alertData.dismissTimeout > 0) {
        alertElement.dataset.autoDismiss = alertData.dismissTimeout;
        
        // Setup progress bar if enabled
        const progressBar = alertElement.querySelector('.MuiAlert-progressBar');
        if (progressBar && this.config.showProgressBar) {
          progressBar.style.transitionDuration = alertData.dismissTimeout + 'ms';
          progressBar.style.width = '0%';
        }
      }
    },

    /**
     * Setup alert-specific behaviors.
     */
    setupAlertBehaviors: function (alertElement, alertData) {
      const self = this;
      
      // Setup close button
      const closeButton = alertElement.querySelector('.MuiAlert-closeButton');
      if (closeButton) {
        closeButton.addEventListener('click', function () {
          self.dismissAlert(alertData.id);
        });
      }
      
      // Setup auto-dismiss
      if (alertData.autoDismiss && alertData.dismissTimeout > 0) {
        setTimeout(() => {
          self.dismissAlert(alertData.id);
        }, alertData.dismissTimeout);
      }
      
      // Setup hover pause for auto-dismiss
      if (alertData.autoDismiss) {
        alertElement.addEventListener('mouseenter', function () {
          self.pauseAutoDismiss(alertData.id);
        });
        
        alertElement.addEventListener('mouseleave', function () {
          self.resumeAutoDismiss(alertData.id);
        });
      }
    },

    /**
     * Dismiss an alert.
     */
    dismissAlert: function (alertId, reason = 'user') {
      const alertInfo = this.activeAlerts.get(alertId);
      if (!alertInfo) {
        return;
      }
      
      const { element, data } = alertInfo;
      
      // Call custom dismiss handler
      if (this.config.onMessageDismiss && typeof window[this.config.onMessageDismiss] === 'function') {
        const result = window[this.config.onMessageDismiss](data, reason, this);
        if (result === false) {
          return; // Cancel dismissal
        }
      }
      
      // Trigger exit animation
      element.classList.add('mui-alert-exiting');
      
      // Remove after animation
      setTimeout(() => {
        if (element.parentNode) {
          element.remove();
        }
        this.activeAlerts.delete(alertId);
        
        // Process queue for new messages
        if (this.messageQueue.length > 0) {
          this.processQueue();
        }
        
        this.updateOverflowIndicator();
      }, 300);
      
      // Dispatch dismiss event
      this.element.dispatchEvent(new CustomEvent('mui:alert:dismissed', {
        bubbles: true,
        detail: { alert: data, reason: reason, container: this }
      }));
    },

    /**
     * Process form errors.
     */
    processFormErrors: function (form) {
      const errorElements = form.querySelectorAll(this.config.formErrorSelector);
      
      errorElements.forEach(errorElement => {
        const errorMessage = this.extractErrorMessage(errorElement);
        if (errorMessage) {
          this.addMessage('error', errorMessage, {
            title: Drupal.t('Form Error'),
            autoDismiss: false,
            formField: errorElement
          });
        }
      });
      
      // Clear original errors if configured
      if (this.config.clearFormErrors) {
        errorElements.forEach(el => el.style.display = 'none');
      }
    },

    /**
     * Process AJAX response for messages.
     */
    processAjaxResponse: function (response) {
      response.forEach(command => {
        if (command.command === 'insert' && command.selector === this.config.ajaxMessageSelector) {
          // Extract messages from AJAX response
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = command.data;
          
          const messages = tempDiv.querySelectorAll('.messages .messages__item');
          messages.forEach(messageElement => {
            const type = this.extractMessageType(messageElement);
            const message = messageElement.textContent.trim();
            if (type && message) {
              this.addMessage(type, message);
            }
          });
        } else if (command.command === 'muiAlertAdd') {
          // Custom AJAX command for adding alerts
          this.addMessage(command.type, command.message, command.options || {});
        }
      });
    },

    /**
     * Setup accessibility announcements.
     */
    setupAccessibilityAnnouncements: function () {
      // Create or get aria-live region
      let liveRegion = document.getElementById('mui-alert-live-region');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'mui-alert-live-region';
        liveRegion.setAttribute('aria-live', this.config.ariaLiveRegion);
        liveRegion.setAttribute('aria-atomic', 'false');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        document.body.appendChild(liveRegion);
      }
      
      this.liveRegion = liveRegion;
    },

    /**
     * Announce message for screen readers.
     */
    announceMessage: function (alertData) {
      if (this.liveRegion && typeof Drupal.announce === 'function') {
        let announcement = alertData.message;
        if (alertData.title) {
          announcement = alertData.title + ': ' + announcement;
        }
        Drupal.announce(announcement);
      }
    },

    /**
     * Show loading state.
     */
    showLoadingState: function () {
      const loadingElement = this.element.querySelector('.mui-alert-loading');
      if (loadingElement) {
        loadingElement.classList.add('is-visible');
      }
      this.element.classList.add('ajax-loading');
    },

    /**
     * Hide loading state.
     */
    hideLoadingState: function () {
      const loadingElement = this.element.querySelector('.mui-alert-loading');
      if (loadingElement) {
        loadingElement.classList.remove('is-visible');
      }
      this.element.classList.remove('ajax-loading');
    },

    /**
     * Utility methods.
     */
    generateAlertId: function () {
      return 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    sanitizeHtml: function (html) {
      const div = document.createElement('div');
      div.textContent = html;
      return div.innerHTML;
    },

    processLinks: function (element) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      element.innerHTML = element.innerHTML.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    },

    extractErrorMessage: function (errorElement) {
      // Try various selectors for error messages
      const selectors = ['.error', '.form-item__error-message', '.help-block'];
      for (const selector of selectors) {
        const errorMsg = errorElement.querySelector(selector);
        if (errorMsg) {
          return errorMsg.textContent.trim();
        }
      }
      return null;
    },

    extractMessageType: function (messageElement) {
      const classList = Array.from(messageElement.classList);
      for (const className of classList) {
        if (this.config.messageTypes.includes(className)) {
          return className;
        }
      }
      return 'info'; // default
    },

    hideOriginalMessages: function () {
      const messageContainers = document.querySelectorAll('.messages');
      messageContainers.forEach(container => {
        if (!container.closest('.mui-alert-drupal')) {
          container.style.display = 'none';
        }
      });
    },

    updateOverflowIndicator: function () {
      const hasOverflow = this.messageQueue.length > 0;
      this.element.classList.toggle('has-overflow', hasOverflow);
    },

    findSimilarMessage: function (alertData) {
      for (const [id, info] of this.activeAlerts) {
        if (info.data.message === alertData.message && info.data.severity === alertData.severity) {
          return info;
        }
      }
      return null;
    },

    groupWithSimilar: function (similar, newData) {
      // Update group count
      if (!similar.data.groupCount) {
        similar.data.groupCount = 1;
      }
      similar.data.groupCount++;
      
      // Update display
      let countElement = similar.element.querySelector('.mui-alert-count');
      if (!countElement) {
        countElement = document.createElement('span');
        countElement.className = 'mui-alert-count';
        similar.element.querySelector('.MuiAlert-messageContent').appendChild(countElement);
      }
      countElement.textContent = similar.data.groupCount;
      
      similar.element.classList.add('grouped');
    },

    clearFormErrorAlerts: function () {
      for (const [id, info] of this.activeAlerts) {
        if (info.data.formField) {
          this.dismissAlert(id, 'form-resubmit');
        }
      }
    },

    registerExistingAlert: function (alertElement) {
      const alertId = alertElement.dataset.alertId || this.generateAlertId();
      const alertData = {
        id: alertId,
        severity: alertElement.dataset.alertSeverity || 'info',
        element: alertElement
      };
      
      this.activeAlerts.set(alertId, {
        element: alertElement,
        data: alertData
      });
    },

    pauseAutoDismiss: function (alertId) {
      // Implementation for pausing auto-dismiss on hover
    },

    resumeAutoDismiss: function (alertId) {
      // Implementation for resuming auto-dismiss
    },

    getHighestPriorityMessage: function () {
      const priorities = { error: 4, warning: 3, info: 2, success: 1 };
      return this.messageQueue.reduce((highest, current) => {
        const currentPriority = priorities[current.severity] || 0;
        const highestPriority = priorities[highest.severity] || 0;
        return currentPriority > highestPriority ? current : highest;
      });
    }
  };

  /**
   * Utility functions for Drupal alert integration.
   */
  Drupal.muiAlertDrupal = {
    
    /**
     * Add a message programmatically.
     */
    addMessage: function (type, message, options = {}) {
      const containers = document.querySelectorAll('.mui-alert-drupal');
      containers.forEach(container => {
        const instance = container.muiAlertDrupal;
        if (instance) {
          instance.addMessage(type, message, options);
        }
      });
    },
    
    /**
     * Clear all alerts.
     */
    clearAll: function () {
      const containers = document.querySelectorAll('.mui-alert-drupal');
      containers.forEach(container => {
        const instance = container.muiAlertDrupal;
        if (instance) {
          for (const alertId of instance.activeAlerts.keys()) {
            instance.dismissAlert(alertId, 'clear-all');
          }
        }
      });
    },
    
    /**
     * Get alert instance from element.
     */
    getInstance: function (element) {
      const container = element.closest('.mui-alert-drupal');
      return container ? container.muiAlertDrupal : null;
    }
  };

  /**
   * Add custom AJAX command for alert messages.
   */
  Drupal.AjaxCommands.prototype.muiAlertAdd = function (ajax, response, status) {
    Drupal.muiAlertDrupal.addMessage(response.type, response.message, response.options || {});
  };

  /**
   * Integration with Drupal's messenger service.
   */
  if (typeof Drupal.Message !== 'undefined') {
    const originalAdd = Drupal.Message.prototype.add;
    Drupal.Message.prototype.add = function (message, options = {}) {
      // Call original method
      const result = originalAdd.call(this, message, options);
      
      // Also add to MUI alerts if configured
      if (drupalSettings.muiAlertDrupal && drupalSettings.muiAlertDrupal.replaceMessages) {
        Drupal.muiAlertDrupal.addMessage(options.type || 'status', message, options);
      }
      
      return result;
    };
  }

})(Drupal, drupalSettings, once);