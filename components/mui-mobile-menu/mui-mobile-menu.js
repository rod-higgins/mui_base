/**
 * @file
 * MUI Mobile Menu component JavaScript.
 */

(function (Drupal) {
  'use strict';

  /**
   * Initialize MUI mobile menu functionality.
   */
  Drupal.behaviors.muiMobileMenu = {
    attach: function (context, settings) {
      const menus = context.querySelectorAll('.MuiMobileMenu-root:not(.js-mui-mobile-menu-processed)');
      
      menus.forEach(function (menu) {
        menu.classList.add('js-mui-mobile-menu-processed');
        
        const toggleButton = menu.querySelector('.MuiMobileMenu-toggle');
        const drawer = menu.querySelector('.MuiMobileMenu-drawer');
        const backdrop = menu.querySelector('.MuiMobileMenu-backdrop');
        const closeButton = menu.querySelector('.MuiMobileMenu-closeButton');
        const expandButtons = menu.querySelectorAll('.MuiMobileMenu-expandButton');
        
        if (!toggleButton || !drawer) return;
        
        // Mobile menu toggle
        toggleButton.addEventListener('click', function () {
          const isOpen = drawer.classList.contains('is-open');
          
          if (isOpen) {
            closeMobileMenu();
          } else {
            openMobileMenu();
          }
        });
        
        // Close button
        if (closeButton) {
          closeButton.addEventListener('click', closeMobileMenu);
        }
        
        // Backdrop click
        if (backdrop) {
          backdrop.addEventListener('click', closeMobileMenu);
        }
        
        // Submenu toggles
        expandButtons.forEach(function (button) {
          button.addEventListener('click', function () {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            const submenu = button.closest('.MuiMobileMenu-listItem').querySelector('.MuiMobileMenu-submenu');
            
            if (submenu) {
              if (isExpanded) {
                collapseSubmenu(button, submenu);
              } else {
                expandSubmenu(button, submenu);
              }
            }
          });
        });
        
        // Keyboard navigation
        drawer.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            closeMobileMenu();
            toggleButton.focus();
          }
        });
        
        // Functions
        function openMobileMenu() {
          drawer.classList.add('is-open');
          toggleButton.setAttribute('aria-expanded', 'true');
          document.body.style.overflow = 'hidden';
          
          // Focus management
          setTimeout(() => {
            const firstFocusable = drawer.querySelector('a, button');
            if (firstFocusable) {
              firstFocusable.focus();
            }
          }, 300);
          
          // Trap focus
          trapFocus(drawer);
        }
        
        function closeMobileMenu() {
          drawer.classList.remove('is-open');
          toggleButton.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
          
          // Remove focus trap
          removeFocusTrap();
        }
        
        function expandSubmenu(button, submenu) {
          button.setAttribute('aria-expanded', 'true');
          submenu.classList.add('is-expanded');
          
          // Calculate height for smooth animation
          const content = submenu.querySelector('.MuiMobileMenu-submenuList');
          if (content) {
            submenu.style.maxHeight = content.scrollHeight + 'px';
          }
        }
        
        function collapseSubmenu(button, submenu) {
          button.setAttribute('aria-expanded', 'false');
          submenu.classList.remove('is-expanded');
          submenu.style.maxHeight = '';
        }
        
        // Focus trap variables
        let focusedElementBeforeTrap;
        let focusableElements;
        let firstFocusableElement;
        let lastFocusableElement;
        
        function trapFocus(element) {
          focusedElementBeforeTrap = document.activeElement;
          
          focusableElements = element.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          
          firstFocusableElement = focusableElements[0];
          lastFocusableElement = focusableElements[focusableElements.length - 1];
          
          element.addEventListener('keydown', handleFocusTrap);
        }
        
        function handleFocusTrap(e) {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
              }
            }
          }
        }
        
        function removeFocusTrap() {
          drawer.removeEventListener('keydown', handleFocusTrap);
          if (focusedElementBeforeTrap) {
            focusedElementBeforeTrap.focus();
          }
        }
        
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', function () {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(function () {
            // Close mobile menu if window becomes large enough for desktop nav
            const breakpoint = menu.dataset.breakpoint || 'md';
            const breakpoints = {
              sm: 600,
              md: 900,
              lg: 1200,
              xl: 1536
            };
            
            if (window.innerWidth >= breakpoints[breakpoint]) {
              closeMobileMenu();
            }
          }, 250);
        });
      });
    }
  };

})(Drupal);