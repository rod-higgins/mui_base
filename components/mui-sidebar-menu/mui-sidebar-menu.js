/**
 * @file
 * MUI Sidebar Menu component JavaScript.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Initialize MUI sidebar menu functionality.
   */
  Drupal.behaviors.muiSidebarMenu = {
    attach: function (context, settings) {
      const menus = once('mui-sidebar-menu', '.MuiSidebarMenu-root', context);
      
      menus.forEach(function (menu) {
        const expandButtons = menu.querySelectorAll('.MuiSidebarMenu-expandButton');
        const isCollapsible = menu.classList.contains('MuiSidebarMenu-collapsible');
        
        if (!isCollapsible) return;
        
        // Initialize expand buttons
        expandButtons.forEach(function (button) {
          const targetId = button.getAttribute('data-target');
          const submenu = document.getElementById(targetId);
          
          if (!submenu) return;
          
          // Set initial state
          const isExpanded = submenu.classList.contains('is-expanded');
          button.setAttribute('aria-expanded', isExpanded.toString());
          
          // Handle button click
          button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const currentExpanded = button.getAttribute('aria-expanded') === 'true';
            
            if (currentExpanded) {
              collapseSubmenu(button, submenu);
            } else {
              expandSubmenu(button, submenu);
            }
          });
        });
        
        // Handle keyboard navigation
        menu.addEventListener('keydown', function (e) {
          handleKeyboardNavigation(e, menu);
        });
        
        // Initialize active states
        initializeActiveStates(menu);
        
        // Auto-expand active trail
        autoExpandActiveTrail(menu);
        
        // Store menu instance for external access
        menu.muiSidebarMenu = {
          expandAll: () => expandAllSubmenus(menu),
          collapseAll: () => collapseAllSubmenus(menu),
          toggleSubmenu: (targetId) => toggleSubmenuById(menu, targetId),
          refresh: () => refresh(menu)
        };
      });
    }
  };

  /**
   * Expand a submenu.
   */
  function expandSubmenu(button, submenu) {
    button.setAttribute('aria-expanded', 'true');
    submenu.classList.add('is-expanded');
    submenu.setAttribute('aria-hidden', 'false');
    
    // Calculate and set max height for smooth animation
    const content = submenu.querySelector('.MuiSidebarMenu-submenuList');
    if (content) {
      const height = content.scrollHeight;
      submenu.style.maxHeight = height + 'px';
      
      // Remove inline style after animation
      setTimeout(() => {
        if (submenu.classList.contains('is-expanded')) {
          submenu.style.maxHeight = '';
        }
      }, 300);
    }
    
    // Dispatch custom event
    submenu.dispatchEvent(new CustomEvent('mui:submenu:expanded', {
      bubbles: true,
      detail: { button, submenu }
    }));
  }

  /**
   * Collapse a submenu.
   */
  function collapseSubmenu(button, submenu) {
    button.setAttribute('aria-expanded', 'false');
    submenu.classList.remove('is-expanded');
    submenu.setAttribute('aria-hidden', 'true');
    submenu.style.maxHeight = '0';
    
    // Dispatch custom event
    submenu.dispatchEvent(new CustomEvent('mui:submenu:collapsed', {
      bubbles: true,
      detail: { button, submenu }
    }));
  }

  /**
   * Handle keyboard navigation.
   */
  function handleKeyboardNavigation(e, menu) {
    const focusableElements = menu.querySelectorAll(
      '.MuiSidebarMenu-link, .MuiSidebarMenu-expandButton'
    );
    const currentIndex = Array.from(focusableElements).indexOf(e.target);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex].focus();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
        focusableElements[prevIndex].focus();
        break;
        
      case 'ArrowRight':
        if (e.target.classList.contains('MuiSidebarMenu-expandButton')) {
          e.preventDefault();
          if (e.target.getAttribute('aria-expanded') === 'false') {
            e.target.click();
          }
        }
        break;
        
      case 'ArrowLeft':
        if (e.target.classList.contains('MuiSidebarMenu-expandButton')) {
          e.preventDefault();
          if (e.target.getAttribute('aria-expanded') === 'true') {
            e.target.click();
          }
        }
        break;
        
      case 'Enter':
      case ' ':
        if (e.target.classList.contains('MuiSidebarMenu-expandButton')) {
          e.preventDefault();
          e.target.click();
        }
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
  }

  /**
   * Initialize active states for menu items.
   */
  function initializeActiveStates(menu) {
    const currentPath = window.location.pathname;
    const links = menu.querySelectorAll('.MuiSidebarMenu-link');
    
    links.forEach(function (link) {
      const linkPath = new URL(link.href).pathname;
      
      if (linkPath === currentPath) {
        link.setAttribute('aria-current', 'page');
        link.closest('.MuiSidebarMenu-item').classList.add('MuiSidebarMenu-activeTrail');
        
        // Mark parent items as active trail
        let parent = link.closest('.MuiSidebarMenu-submenu');
        while (parent) {
          const parentItem = parent.closest('.MuiSidebarMenu-item');
          if (parentItem) {
            parentItem.classList.add('MuiSidebarMenu-activeTrail');
            const parentLink = parentItem.querySelector('.MuiSidebarMenu-link');
            if (parentLink) {
              parentLink.classList.add('MuiSidebarMenu-activeTrail');
            }
          }
          parent = parent.parentElement.closest('.MuiSidebarMenu-submenu');
        }
      }
    });
  }

  /**
   * Auto-expand submenus containing active items.
   */
  function autoExpandActiveTrail(menu) {
    const activeItems = menu.querySelectorAll('.MuiSidebarMenu-activeTrail');
    
    activeItems.forEach(function (item) {
      // Find parent submenus that should be expanded
      let parent = item.closest('.MuiSidebarMenu-submenu');
      while (parent) {
        const expandButton = parent.parentElement.querySelector('.MuiSidebarMenu-expandButton');
        if (expandButton && parent.classList.contains('MuiSidebarMenu-collapsible')) {
          expandSubmenu(expandButton, parent);
        }
        parent = parent.parentElement.closest('.MuiSidebarMenu-submenu');
      }
    });
  }

  /**
   * Expand all submenus.
   */
  function expandAllSubmenus(menu) {
    const expandButtons = menu.querySelectorAll('.MuiSidebarMenu-expandButton');
    expandButtons.forEach(function (button) {
      const targetId = button.getAttribute('data-target');
      const submenu = document.getElementById(targetId);
      if (submenu && !submenu.classList.contains('is-expanded')) {
        expandSubmenu(button, submenu);
      }
    });
  }

  /**
   * Collapse all submenus.
   */
  function collapseAllSubmenus(menu) {
    const expandButtons = menu.querySelectorAll('.MuiSidebarMenu-expandButton');
    expandButtons.forEach(function (button) {
      const targetId = button.getAttribute('data-target');
      const submenu = document.getElementById(targetId);
      if (submenu && submenu.classList.contains('is-expanded')) {
        collapseSubmenu(button, submenu);
      }
    });
  }

  /**
   * Toggle submenu by ID.
   */
  function toggleSubmenuById(menu, targetId) {
    const submenu = document.getElementById(targetId);
    const button = menu.querySelector(`[data-target="${targetId}"]`);
    
    if (submenu && button) {
      const isExpanded = submenu.classList.contains('is-expanded');
      if (isExpanded) {
        collapseSubmenu(button, submenu);
      } else {
        expandSubmenu(button, submenu);
      }
    }
  }

  /**
   * Refresh menu state.
   */
  function refresh(menu) {
    initializeActiveStates(menu);
    autoExpandActiveTrail(menu);
  }

  /**
   * Utility function to create a sidebar menu programmatically.
   */
  Drupal.muiSidebarMenu = {
    /**
     * Create a new sidebar menu instance.
     */
    create: function (container, options = {}) {
      const defaults = {
        collapsible: true,
        autoExpand: true,
        compact: false,
        showIcons: true
      };
      
      const settings = Object.assign({}, defaults, options);
      
      container.classList.add('MuiSidebarMenu-root');
      if (settings.collapsible) {
        container.classList.add('MuiSidebarMenu-collapsible');
      }
      if (settings.compact) {
        container.classList.add('MuiSidebarMenu-compact');
      }
      
      // Initialize the menu
      Drupal.behaviors.muiSidebarMenu.attach(container);
      
      return container.muiSidebarMenu;
    },
    
    /**
     * Get menu instance from element.
     */
    getInstance: function (element) {
      const menu = element.closest('.MuiSidebarMenu-root');
      return menu ? menu.muiSidebarMenu : null;
    }
  };

})(Drupal, once);