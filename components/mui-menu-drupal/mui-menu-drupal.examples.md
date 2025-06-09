# MUI Menu Drupal Integration - Usage Examples

## Basic Usage

### 1. Render Main Navigation Menu

```twig
{# In your page template or region #}
{% include '@mui_base/mui-menu-drupal/mui-menu-drupal.twig' with {
  menu_name: 'main',
  variant: 'menu',
  elevation: 4,
  show_active_trail: true
} %}
```

### 2. User Account Menu Dropdown

```twig
{# User account dropdown menu #}
{% include '@mui_base/mui-menu-drupal/mui-menu-drupal.twig' with {
  menu_name: 'account',
  variant: 'selectedMenu',
  elevation: 8,
  dense: true,
  context_menu: false,
  menu_classes: ['user-menu']
} %}
```

### 3. Footer Menu

```twig
{# Footer navigation menu #}
{% include '@mui_base/mui-menu-drupal/mui-menu-drupal.twig' with {
  menu_name: 'footer',
  level: 1,
  depth: 2,
  elevation: 2,
  searchable: false,
  show_active_trail: true
} %}
```

## Advanced Usage

### 4. Menu with Icons

```twig
{# Menu with icon field support #}
{% include '@mui_base/mui-menu-drupal/mui-menu-drupal.twig' with {
  menu_name: 'main',
  icon_field: 'field_menu_icon',
  icon_default: '<svg>...</svg>',
  variant: 'menu',
  elevation: 6
} %}
```

### 5. Searchable Admin Menu

```twig
{# Administration menu with search #}
{% include '@mui_base/mui-menu-drupal/mui-menu-drupal.twig' with {
  menu_name: 'admin',
  searchable: true,
  search_placeholder: 'Search admin menu...',
  dense: true,
  max_height: '400px',
  menu_classes: ['admin-menu']
} %}
```

### 6. Context Menu

```twig
{# Right-click context menu #}
{% include '@mui_base/mui-menu-drupal/mui-menu-drupal.twig' with {
  menu_name: 'context-actions',
  context_menu: true,
  elevation: 12,
  auto_focus: true,
  on_select: 'handleContextMenuSelection'
} %}
```

## PHP Integration

### 7. Preprocess Hook for Custom Menu Transformation

```php
<?php
// In your theme's .theme file

/**
 * Implements hook_preprocess_mui_menu_drupal().
 */
function MYTHEME_preprocess_mui_menu_drupal(&$variables) {
  // Add custom icon handling
  if ($variables['menu_name'] === 'main') {
    $variables['icon_field'] = 'field_icon';
    $variables['transform_callback'] = 'MYTHEME_transform_main_menu_items';
  }
  
  // Add custom CSS classes based on menu
  $variables['menu_classes'][] = 'menu-' . str_replace('_', '-', $variables['menu_name']);
}

/**
 * Custom menu item transformation callback.
 */
function MYTHEME_transform_main_menu_items($items, $variables) {
  foreach ($items as &$item) {
    // Add custom data attributes
    $item['data_attributes']['menu-type'] = 'main-nav';
    
    // Add custom styling for specific items
    if (strpos($item['url'], '/products') !== false) {
      $item['css_classes'][] = 'products-menu-item';
    }
  }
  return $items;
}
```

### 8. Custom Menu Tree Manipulation

```php
<?php
// In a custom module or theme

/**
 * Alter menu tree before rendering.
 */
function MYMODULE_menu_tree_alter(&$tree, $menu_name) {
  if ($menu_name === 'main') {
    foreach ($tree as &$element) {
      // Add custom data to menu links
      $element->link->getOptions()['attributes']['data-analytics'] = 'main-nav';
    }
  }
}
```

## JavaScript Integration

### 9. Custom Menu Event Handling

```javascript
// In your theme's JavaScript file

(function (Drupal) {
  'use strict';
  
  // Listen for Drupal menu selections
  document.addEventListener('drupal:menu:selection', function (e) {
    // Track menu clicks for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'menu_click', {
        'menu_name': e.detail.menuName,
        'item_text': e.detail.itemText,
        'item_url': e.detail.itemUrl
      });
    }
  });
  
  // Custom menu interaction
  Drupal.behaviors.customMenuHandling = {
    attach: function (context, settings) {
      // Add custom click handler for specific menu items
      const productMenus = context.querySelectorAll('.products-menu-item');
      productMenus.forEach(function (item) {
        item.addEventListener('click', function (e) {
          // Custom product menu logic
          console.log('Product menu clicked:', item.textContent);
        });
      });
    }
  };
  
})(Drupal);
```

### 10. Dynamic Menu Updates

```javascript
// Update menu via AJAX
function updateUserMenu() {
  const userMenu = document.querySelector('.user-menu');
  const menuInstance = Drupal.muiMenuDrupal.getInstance(userMenu);
  
  if (menuInstance) {
    menuInstance.refreshMenu();
  }
}

// Create menu programmatically
Drupal.muiMenuDrupal.create('quick-actions', {
  variant: 'menu',
  elevation: 8,
  searchable: true
}).then(function (menu) {
  document.body.appendChild(menu.element);
  menu.instance.open();
});
```

## Theming Examples

### 11. Custom Menu Template Override

```twig
{# themes/custom/mytheme/templates/mui-menu-drupal.html.twig #}
{% extends '@mui_base/mui-menu-drupal/mui-menu-drupal.twig' %}

{# Add custom header for main menu #}
{% if menu_name == 'main' %}
  {% set header_content %}
    <div class="main-menu-header">
      <h4>Navigation</h4>
      <p>Choose a section</p>
    </div>
  {% endset %}
{% endif %}
```

### 12. CSS Customization

```css
/* Custom styling for specific menus */
.menu-main {
  --mui-primary-main: #2196F3;
}

.menu-main .MuiMenuItem-root:hover {
  background-color: rgba(33, 150, 243, 0.08);
}

.menu-footer {
  font-size: 0.875rem;
}

.menu-footer .MuiMenuItem-root {
  min-height: 40px;
}

/* Custom active trail styling */
.menu-main .MuiMenuItem-root.is-active {
  background: linear-gradient(90deg, var(--mui-primary-main), transparent);
  border-left: 4px solid var(--mui-primary-main);
}
```

## Configuration Examples

### 13. Settings in theme.info.yml

```yaml
# Add menu-specific settings
mui_menu_drupal:
  settings:
    warn_external_links: true
    access_checking: true
    csrf_token: true
    cache_menu_trees: true
```

### 14. Block Configuration

```yaml
# In a custom block plugin
menu_name: 'main'
mui_settings:
  variant: 'menu'
  elevation: 4
  dense: false
  searchable: true
  show_active_trail: true
  icon_field: 'field_icon'
  max_height: '60vh'
```

These examples demonstrate the flexibility and power of the MUI Menu Drupal integration component, showing how it can be used for various navigation scenarios while maintaining Material Design principles and Drupal best practices.