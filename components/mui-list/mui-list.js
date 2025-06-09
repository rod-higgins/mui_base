/**
 * @file
 * MUI List component JavaScript for interactive features.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Initialize MUI List functionality.
   */
  Drupal.behaviors.muiList = {
    attach: function (context, settings) {
      const lists = once('mui-list', '.MuiList-root', context);
      
      lists.forEach(function (list) {
        const searchInput = list.querySelector('.MuiList-searchInput');
        const expandButtons = list.querySelectorAll('.MuiListItem-expandButton');
        const selectableItems = list.querySelectorAll('.MuiList-selectable .MuiListItem-root[role="option"]');
        const checkboxes = list.querySelectorAll('.MuiCheckbox-input');
        const radios = list.querySelectorAll('.MuiRadio-input');
        const switches = list.querySelectorAll('.MuiSwitch-input');
        
        // Initialize search functionality
        if (searchInput) {
          initializeSearch(list, searchInput);
        }
        
        // Initialize expand/collapse functionality
        expandButtons.forEach(function (button) {
          initializeExpandCollapse(button);
        });
        
        // Initialize selection functionality
        if (selectableItems.length > 0) {
          initializeSelection(list, selectableItems);
        }
        
        // Initialize form controls
        checkboxes.forEach(function (checkbox) {
          initializeCheckbox(checkbox);
        });
        
        radios.forEach(function (radio) {
          initializeRadio(radio);
        });
        
        switches.forEach(function (switchInput) {
          initializeSwitch(switchInput);
        });
        
        // Initialize keyboard navigation
        initializeKeyboardNavigation(list);
        
        // Store list instance for external access
        list.muiList = {
          search: (term) => performSearch(list, term),
          expandAll: () => expandAllItems(list),
          collapseAll: () => collapseAllItems(list),
          getSelectedItems: () => getSelectedItems(list),
          selectItem: (itemId) => selectItem(list, itemId),
          deselectItem: (itemId) => deselectItem(list, itemId),
          clearSelection: () => clearSelection(list)
        };
      });
    }
  };

  /**
   * Initialize search functionality.
   */
  function initializeSearch(list, searchInput) {
    let searchTimeout;
    
    searchInput.addEventListener('input', function (e) {
      clearTimeout(searchTimeout);
      const searchTerm = e.target.value.toLowerCase().trim();
      
      // Debounce search
      searchTimeout = setTimeout(() => {
        performSearch(list, searchTerm);
      }, 300);
    });
    
    // Clear search on escape
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.target.value = '';
        performSearch(list, '');
        e.target.blur();
      }
    });
  }

  /**
   * Perform search filtering.
   */
  function performSearch(list, searchTerm) {
    const items = list.querySelectorAll('.MuiListItem-root');
    let visibleCount = 0;
    
    items.forEach(function (item) {
      const primaryText = item.querySelector('.MuiListItem-primary');
      const secondaryText = item.querySelector('.MuiListItem-secondary');
      const overlineText = item.querySelector('.MuiListItem-overline');
      
      let text = '';
      if (primaryText) text += primaryText.textContent.toLowerCase();
      if (secondaryText) text += ' ' + secondaryText.textContent.toLowerCase();
      if (overlineText) text += ' ' + overlineText.textContent.toLowerCase();
      
      const isVisible = !searchTerm || text.includes(searchTerm);
      
      item.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });
    
    // Dispatch search event
    list.dispatchEvent(new CustomEvent('mui:list:search', {
      bubbles: true,
      detail: { 
        searchTerm, 
        visibleCount,
        totalCount: items.length 
      }
    }));
  }

  /**
   * Initialize expand/collapse functionality.
   */
  function initializeExpandCollapse(button) {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      
      const listItem = button.closest('.MuiListItem-root');
      const nestedContainer = listItem.nextElementSibling;
      
      if (nestedContainer && nestedContainer.classList.contains('MuiListItem-nestedContainer')) {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          collapseItem(button, nestedContainer);
        } else {
          expandItem(button, nestedContainer);
        }
      }
    });
  }

  /**
   * Expand a list item.
   */
  function expandItem(button, container) {
    button.setAttribute('aria-expanded', 'true');
    container.classList.add('is-expanded');
    
    // Calculate height for smooth animation
    const content = container.querySelector('.MuiList-nested');
    if (content) {
      container.style.maxHeight = content.scrollHeight + 'px';
      
      // Remove inline style after animation
      setTimeout(() => {
        if (container.classList.contains('is-expanded')) {
          container.style.maxHeight = '';
        }
      }, 300);
    }
    
    // Dispatch event
    container.dispatchEvent(new CustomEvent('mui:list:item:expanded', {
      bubbles: true,
      detail: { button, container }
    }));
  }

  /**
   * Collapse a list item.
   */
  function collapseItem(button, container) {
    button.setAttribute('aria-expanded', 'false');
    container.classList.remove('is-expanded');
    container.style.maxHeight = '0';
    
    // Dispatch event
    container.dispatchEvent(new CustomEvent('mui:list:item:collapsed', {
      bubbles: true,
      detail: { button, container }
    }));
  }

  /**
   * Initialize selection functionality.
   */
  function initializeSelection(list, items) {
    const selectionMode = getSelectionMode(list);
    
    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        // Don't handle selection if clicking on a form control
        if (e.target.closest('.MuiCheckbox-root, .MuiRadio-root, .MuiSwitch-root, .MuiListItem-expandButton')) {
          return;
        }
        
        handleItemSelection(list, item, selectionMode, e);
      });
      
      // Keyboard selection
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleItemSelection(list, item, selectionMode, e);
        }
      });
    });
  }

  /**
   * Get selection mode from list.
   */
  function getSelectionMode(list) {
    if (list.classList.contains('MuiList-selectable')) {
      // Check for specific mode in data attribute or class
      return list.dataset.selectionMode || 'single';
    }
    return 'none';
  }

  /**
   * Handle item selection.
   */
  function handleItemSelection(list, item, selectionMode, event) {
    if (selectionMode === 'none') return;
    
    const isSelected = item.getAttribute('aria-selected') === 'true';
    
    if (selectionMode === 'single') {
      // Clear other selections
      const selectedItems = list.querySelectorAll('[aria-selected="true"]');
      selectedItems.forEach(function (selectedItem) {
        if (selectedItem !== item) {
          selectedItem.setAttribute('aria-selected', 'false');
          selectedItem.classList.remove('MuiListItem-selected');
        }
      });
      
      // Toggle current item
      item.setAttribute('aria-selected', (!isSelected).toString());
      item.classList.toggle('MuiListItem-selected', !isSelected);
      
    } else if (selectionMode === 'multiple') {
      // Toggle current item
      item.setAttribute('aria-selected', (!isSelected).toString());
      item.classList.toggle('MuiListItem-selected', !isSelected);
    }
    
    // Dispatch selection event
    list.dispatchEvent(new CustomEvent('mui:list:selection:changed', {
      bubbles: true,
      detail: { 
        item, 
        selected: !isSelected, 
        selectedItems: getSelectedItems(list),
        event 
      }
    }));
  }

  /**
   * Initialize checkbox functionality.
   */
  function initializeCheckbox(checkbox) {
    checkbox.addEventListener('change', function () {
      const listItem = checkbox.closest('.MuiListItem-root');
      
      // Dispatch event
      listItem.dispatchEvent(new CustomEvent('mui:list:checkbox:changed', {
        bubbles: true,
        detail: { 
          checkbox, 
          checked: checkbox.checked,
          item: listItem 
        }
      }));
    });
  }

  /**
   * Initialize radio functionality.
   */
  function initializeRadio(radio) {
    radio.addEventListener('change', function () {
      const listItem = radio.closest('.MuiListItem-root');
      const list = radio.closest('.MuiList-root');
      
      // Clear other radios in the same group
      const groupName = radio.name;
      if (groupName) {
        const otherRadios = list.querySelectorAll(`input[name="${groupName}"]`);
        otherRadios.forEach(function (otherRadio) {
          if (otherRadio !== radio) {
            otherRadio.checked = false;
          }
        });
      }
      
      // Dispatch event
      listItem.dispatchEvent(new CustomEvent('mui:list:radio:changed', {
        bubbles: true,
        detail: { 
          radio, 
          checked: radio.checked,
          item: listItem 
        }
      }));
    });
  }

  /**
   * Initialize switch functionality.
   */
  function initializeSwitch(switchInput) {
    switchInput.addEventListener('change', function () {
      const listItem = switchInput.closest('.MuiListItem-root');
      
      // Dispatch event
      listItem.dispatchEvent(new CustomEvent('mui:list:switch:changed', {
        bubbles: true,
        detail: { 
          switch: switchInput, 
          checked: switchInput.checked,
          item: listItem 
        }
      }));
    });
  }

  /**
   * Initialize keyboard navigation.
   */
  function initializeKeyboardNavigation(list) {
    const focusableItems = list.querySelectorAll('.MuiListItem-button, .MuiListItem-root[role="option"]');
    
    list.addEventListener('keydown', function (e) {
      const currentIndex = Array.from(focusableItems).indexOf(e.target);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, focusableItems.length - 1);
          focusableItems[nextIndex].focus();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          focusableItems[prevIndex].focus();
          break;
          
        case 'Home':
          e.preventDefault();
          focusableItems[0].focus();
          break;
          
        case 'End':
          e.preventDefault();
          focusableItems[focusableItems.length - 1].focus();
          break;
      }
    });
  }

  /**
   * Expand all expandable items.
   */
  function expandAllItems(list) {
    const expandButtons = list.querySelectorAll('.MuiListItem-expandButton[aria-expanded="false"]');
    expandButtons.forEach(function (button) {
      button.click();
    });
  }

  /**
   * Collapse all expandable items.
   */
  function collapseAllItems(list) {
    const collapseButtons = list.querySelectorAll('.MuiListItem-expandButton[aria-expanded="true"]');
    collapseButtons.forEach(function (button) {
      button.click();
    });
  }

  /**
   * Get currently selected items.
   */
  function getSelectedItems(list) {
    const selectedItems = list.querySelectorAll('[aria-selected="true"]');
    return Array.from(selectedItems).map(function (item) {
      return {
        element: item,
        id: item.dataset.id,
        text: item.querySelector('.MuiListItem-primary')?.textContent
      };
    });
  }

  /**
   * Select item by ID.
   */
  function selectItem(list, itemId) {
    const item = list.querySelector(`[data-id="${itemId}"]`);
    if (item && item.getAttribute('aria-selected') === 'false') {
      item.click();
    }
  }

  /**
   * Deselect item by ID.
   */
  function deselectItem(list, itemId) {
    const item = list.querySelector(`[data-id="${itemId}"]`);
    if (item && item.getAttribute('aria-selected') === 'true') {
      item.click();
    }
  }

  /**
   * Clear all selections.
   */
  function clearSelection(list) {
    const selectedItems = list.querySelectorAll('[aria-selected="true"]');
    selectedItems.forEach(function (item) {
      item.setAttribute('aria-selected', 'false');
      item.classList.remove('MuiListItem-selected');
    });
    
    list.dispatchEvent(new CustomEvent('mui:list:selection:cleared', {
      bubbles: true
    }));
  }

  /**
   * Utility function to create a list programmatically.
   */
  Drupal.muiList = {
    /**
     * Create a new list instance.
     */
    create: function (container, options = {}) {
      const defaults = {
        variant: 'standard',
        density: 'standard',
        selectable: 'none',
        searchEnabled: false
      };
      
      const settings = Object.assign({}, defaults, options);
      
      container.classList.add('MuiList-root', `MuiList-${settings.variant}`, `MuiList-${settings.density}`);
      
      if (settings.selectable !== 'none') {
        container.classList.add('MuiList-selectable');
        container.dataset.selectionMode = settings.selectable;
      }
      
      // Initialize the list
      Drupal.behaviors.muiList.attach(container);
      
      return container.muiList;
    },
    
    /**
     * Get list instance from element.
     */
    getInstance: function (element) {
      const list = element.closest('.MuiList-root');
      return list ? list.muiList : null;
    }
  };

})(Drupal, once);