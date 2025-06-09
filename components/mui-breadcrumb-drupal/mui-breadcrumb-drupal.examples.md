# MUI Breadcrumb Drupal Integration - Usage Examples

## Basic Usage

### 1. Path-Based Breadcrumbs (Default)

```twig
{# In your page template #}
{% include '@mui_base/mui-breadcrumb-drupal/mui-breadcrumb-drupal.twig' with {
  breadcrumb_source: 'path',
  variant: 'standard',
  size: 'medium',
  show_home: true,
  show_current: true
} %}
```

### 2. Menu-Based Breadcrumbs

```twig
{# Generate breadcrumbs from main navigation #}
{% include '@mui_base/mui-breadcrumb-drupal/mui-breadcrumb-drupal.twig' with {
  breadcrumb_source: 'menu',
  menu_name: 'main',
  variant: 'outlined',
  color: 'primary',
  structured_data: true
} %}
```

### 3. Taxonomy Hierarchy Breadcrumbs

```twig
{# For taxonomy term pages or content with taxonomy #}
{% include '@mui_base/mui-breadcrumb-drupal/mui-breadcrumb-drupal.twig' with {
  breadcrumb_source: 'taxonomy',
  taxonomy_vocabulary: 'categories',
  show_taxonomy_hierarchy: true,
  separator: '>',
  color: 'secondary'
} %}
```

## Advanced Usage

### 4. Book Navigation Breadcrumbs

```twig
{# For book module integration #}
{% include '@mui_base/mui-breadcrumb-drupal/mui-breadcrumb-drupal.twig' with {
  breadcrumb_source: 'book',
  book_outline_depth: 5,
  variant: 'filled',
  show_entity_type: true,
  structured_data: true
} %}
```

### 5. Custom Breadcrumbs with Analytics

```twig
{# Custom breadcrumbs with tracking #}
{% include '@mui_base/mui-breadcrumb-drupal/mui-breadcrumb-drupal.twig' with {
  breadcrumb_source: 'custom',
  custom_breadcrumbs: [
    {'text': 'Products', 'url': '/products'},
    {'text': 'Electronics', 'url': '/products/electronics'},
    {'text': 'Smartphones', 'url': '/products/electronics/smartphones'}
  ],
  track_analytics: true,
  click_handler: 'trackBreadcrumbNavigation'
} %}
```

### 6. Multi-Language Breadcrumbs

```twig
{# Language-aware breadcrumbs #}
{% include '@mui_base/mui-breadcrumb-drupal/mui-breadcrumb-drupal.twig' with {
  breadcrumb_source: 'path',
  language_aware: true,
  absolute_urls: false,
  title_source: 'node_title',
  metatag_integration: true
} %}
```

## PHP Integration

### 7. Custom Preprocess Hook

```php
<?php
// In your theme's .theme file

/**
 * Implements hook_preprocess_mui_breadcrumb_drupal().
 */
function MYTHEME_preprocess_mui_breadcrumb_drupal(&$variables) {
  // Custom breadcrumb logic for specific content types
  $entity = _mui_base_get_current_entity(\Drupal::routeMatch());
  
  if ($entity && $entity->getEntityTypeId() === 'node') {
    $variables['title_source'] = 'node_title';
    $variables['show_entity_type'] = TRUE;
    
    // Add custom CSS classes based on content type
    $variables['breadcrumb_classes'][] = 'breadcrumb-' . $entity->bundle();
  }
  
  // Custom breadcrumb for admin pages
  $current_path = \Drupal::request()->getPathInfo();
  if (strpos($current_path, '/admin') === 0) {
    $variables['color'] = 'warning';
    $variables['variant'] = 'outlined';
    $variables['breadcrumb_classes'][] = 'admin-breadcrumb';
  }
}

/**
 * Custom breadcrumb preprocessing callback.
 */
function MYTHEME_preprocess_product_breadcrumbs($breadcrumbs, $variables) {
  // Add product category hierarchy for commerce sites
  foreach ($breadcrumbs as &$breadcrumb) {
    if (isset($breadcrumb['entity']) && 
        $breadcrumb['entity']->getEntityTypeId() === 'commerce_product') {
      
      // Add product category to breadcrumb text
      $categories = $breadcrumb['entity']->get('field_category')->referencedEntities();
      if (!empty($categories)) {
        $breadcrumb['text'] = $categories[0]->getName() . ' > ' . $breadcrumb['text'];
      }
    }
  }
  
  return $breadcrumbs;
}
```

### 8. Custom Breadcrumb Builder Service

```php
<?php
// In a custom module

namespace Drupal\mymodule\Breadcrumb;

use Drupal\Core\Breadcrumb\Breadcrumb;
use Drupal\Core\Breadcrumb\BreadcrumbBuilderInterface;
use Drupal\Core\Routing\RouteMatchInterface;

/**
 * Custom breadcrumb builder for MUI integration.
 */
class MuiBreadcrumbBuilder implements BreadcrumbBuilderInterface {

  /**
   * {@inheritdoc}
   */
  public function applies(RouteMatchInterface $route_match) {
    // Apply to specific routes
    return $route_match->getRouteName() === 'entity.node.canonical';
  }

  /**
   * {@inheritdoc}
   */
  public function build(RouteMatchInterface $route_match) {
    $breadcrumb = new Breadcrumb();
    $breadcrumb->addCacheContexts(['url.path']);
    
    $node = $route_match->getParameter('node');
    if ($node) {
      // Build custom breadcrumb logic
      $breadcrumb->addCacheTags(['node:' . $node->id()]);
      
      // Add links based on node hierarchy
      if ($node->hasField('field_parent_page') && !$node->get('field_parent_page')->isEmpty()) {
        $parent = $node->get('field_parent_page')->entity;
        if ($parent) {
          $breadcrumb->addLink($parent->toLink());
        }
      }
    }
    
    return $breadcrumb;
  }
}
```

## JavaScript Integration

### 9. Custom Analytics Tracking

```javascript
// In your theme's JavaScript file

(function (Drupal) {
  'use strict';
  
  // Custom breadcrumb click handler
  window.trackBreadcrumbNavigation = function(e, breadcrumbInstance) {
    const link = e.target.closest('.MuiBreadcrumb-link');
    const entityType = link.dataset.entityType;
    const entityId = link.dataset.entityId;
    
    // Send custom analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'breadcrumb_navigation', {
        'entity_type': entityType,
        'entity_id': entityId,
        'breadcrumb_text': link.textContent.trim(),
        'page_location': window.location.href
      });
    }
    
    // Don't prevent default navigation
    return true;
  };
  
  // Listen for custom breadcrumb events
  document.addEventListener('drupal:breadcrumb:click', function (e) {
    console.log('Breadcrumb clicked:', e.detail);
    
    // Custom business logic
    if (e.detail.entityData.entityType === 'commerce_product') {
      // Track product breadcrumb clicks differently
      trackProductBreadcrumb(e.detail);
    }
  });
  
  // Dynamic breadcrumb updates for SPA-like behavior
  Drupal.behaviors.dynamicBreadcrumbs = {
    attach: function (context, settings) {
      // Update breadcrumbs when content changes
      document.addEventListener('drupal:ajax:complete', function (e) {
        // Check if we need to update breadcrumbs
        const breadcrumbContainers = document.querySelectorAll('.mui-breadcrumb-drupal');
        breadcrumbContainers.forEach(function (container) {
          const instance = Drupal.muiBreadcrumbDrupal.getInstance(container);
          if (instance) {
            instance.updateBreadcrumbForCurrentPath();
          }
        });
      });
    }
  };
  
})(Drupal);
```

### 10. Programmatic Breadcrumb Creation

```javascript
// Create breadcrumbs dynamically
function createDynamicBreadcrumb() {
  Drupal.muiBreadcrumbDrupal.create('taxonomy', {
    variant: 'outlined',
    size: 'small',
    color: 'primary',
    showHome: true,
    trackAnalytics: true
  }).then(function (breadcrumb) {
    // Insert into page
    const container = document.querySelector('.breadcrumb-container');
    container.appendChild(breadcrumb.element);
  }).catch(function (error) {
    console.error('Failed to create breadcrumb:', error);
  });
}
```

## Theming Examples

### 11. Custom Template Override

```twig
{# themes/custom/mytheme/templates/mui-breadcrumb-drupal.html.twig #}
{% extends '@mui_base/mui-breadcrumb-drupal/mui-breadcrumb-drupal.twig' %}

{# Add custom wrapper for specific breadcrumb sources #}
{% if breadcrumb_source == 'book' %}
  <div class="book-breadcrumb-wrapper">
    <h4>Book Navigation</h4>
    {{ parent() }}
  </div>
{% else %}
  {{ parent() }}
{% endif %}
```

### 12. CSS Customization

```css
/* Custom styling for different content types */
.breadcrumb-article .MuiBreadcrumb-link {
  color: #2196F3;
}

.breadcrumb-article .MuiBreadcrumb-link::before {
  content: '📰';
  margin-right: 4px;
}

.breadcrumb-event .MuiBreadcrumb-link {
  color: #FF9800;
}

.breadcrumb-event .MuiBreadcrumb-link::before {
  content: '📅';
  margin-right: 4px;
}

/* Custom styling for admin breadcrumbs */
.admin-breadcrumb.MuiBreadcrumb-root {
  background: linear-gradient(90deg, #FFF3E0, transparent);
  border-left: 4px solid #FF9800;
  padding: 8px 12px;
  border-radius: 4px;
}

/* Seasonal theme adjustments */
.holiday-theme .MuiBreadcrumb-separator {
  color: #4CAF50;
}

.holiday-theme .MuiBreadcrumb-separator::before {
  content: '🎄';
}
```

## Configuration Examples

### 13. Block Configuration

```yaml
# In a custom block plugin
breadcrumb_config:
  source: 'menu'
  menu_name: 'main'
  mui_settings:
    variant: 'standard'
    size: 'medium'
    color: 'primary'
    show_home: true
    show_current: true
    max_items: 6
    structured_data: true
    track_analytics: true
```

### 14. Views Integration

```yaml
# Custom breadcrumb for Views pages
views_breadcrumb:
  display_title: true
  prepend_site_name: false
  mui_breadcrumb:
    source: 'custom'
    variant: 'outlined'
    separator: '/'
    color: 'secondary'
```

### 15. Commerce Integration

```php
<?php
// For Drupal Commerce product pages

/**
 * Implements hook_preprocess_mui_breadcrumb_drupal().
 */
function commerce_mui_preprocess_mui_breadcrumb_drupal(&$variables) {
  $entity = _mui_base_get_current_entity(\Drupal::routeMatch());
  
  if ($entity && $entity->getEntityTypeId() === 'commerce_product') {
    // Add product category hierarchy
    $variables['breadcrumb_source'] = 'custom';
    $variables['custom_breadcrumbs'] = _commerce_mui_build_product_breadcrumbs($entity);
    $variables['breadcrumb_classes'][] = 'commerce-product-breadcrumb';
  }
}

function _commerce_mui_build_product_breadcrumbs($product) {
  $breadcrumbs = [];
  
  // Add categories hierarchy
  if ($product->hasField('field_category')) {
    $categories = $product->get('field_category')->referencedEntities();
    foreach ($categories as $category) {
      $breadcrumbs[] = [
        'text' => $category->getName(),
        'url' => $category->toUrl()->toString(),
        'entity' => $category
      ];
    }
  }
  
  return $breadcrumbs;
}
```

These examples demonstrate the flexibility and power of the MUI Breadcrumb Drupal integration, showing how it can be customized for various content types, navigation patterns, and business requirements while maintaining Material Design principles and Drupal best practices.