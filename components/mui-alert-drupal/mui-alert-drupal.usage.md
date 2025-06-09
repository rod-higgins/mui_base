# MUI Alert Drupal Integration - Usage Examples

## Basic Usage

### 1. Render Alert Container in Template

```twig
{# In your page template or region #}
{% include '@mui_base/mui-alert-drupal/mui-alert-drupal.twig' with {
  handle_messenger: true,
  handle_form_errors: true,
  position: 'top-right',
  auto_dismiss: true,
  max_alerts: 5
} %}
```

### 2. Block Configuration

```twig
{# Using the MUI Alert block #}
{% set alert_block = {
  plugin: 'mui_alert_block',
  settings: {
    message_types: ['status', 'warning', 'error', 'info'],
    position: 'top-center',
    auto_dismiss: true,
    replace_drupal_messages: true
  }
} %}
{{ drupal_block(alert_block.plugin, alert_block.settings) }}
```

### 3. Programmatic Alert Creation

```php
<?php
// Add a simple success alert
mui_base_components_add_alert(
  'status',
  'Your changes have been saved successfully!'
);

// Add an error alert with custom options
mui_base_components_add_alert(
  'error',
  'An error occurred while processing your request.',
  [
    'title' => 'Processing Error',
    'auto_dismiss' => false,
    'actions' => [
      [
        'label' => 'Retry',
        'click_handler' => 'retryLastAction'
      ]
    ]
  ]
);
```

## Advanced Usage

### 4. Custom Form Integration

```php
<?php
/**
 * Implements hook_form_alter().
 */
function mymodule_form_alter(&$form, FormStateInterface $form_state, $form_id) {
  if ($form_id === 'my_custom_form') {
    // Enable MUI alerts for this form
    $form['#attached']['library'][] = 'mui_base/mui-alert-drupal';
    
    // Add custom validation handler
    $form['#validate'][] = 'mymodule_custom_form_validate';
    
    // Add AJAX wrapper for dynamic alerts
    $form['actions']['submit']['#ajax'] = [
      'callback' => 'mymodule_custom_form_ajax_callback',
      'wrapper' => 'custom-form-wrapper',
    ];
  }
}

/**
 * Custom form validation with alerts.
 */
function mymodule_custom_form_validate(&$form, FormStateInterface $form_state) {
  $email = $form_state->getValue('email');
  
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    // This will be converted to a MUI alert
    $form_state->setErrorByName('email', t('Please enter a valid email address.'));
  }
  
  // Add custom alert for additional validation
  if (strpos($email, '@company.com') === false) {
    mui_base_components_add_alert(
      'warning',
      'External email addresses may experience delivery delays.',
      ['title' => 'Email Notice']
    );
  }
}

/**
 * AJAX callback with alert integration.
 */
function mymodule_custom_form_ajax_callback(&$form, FormStateInterface $form_state) {
  $ajax_builder = \Drupal::service('mui_base_components.ajax_alert_builder');
  
  if ($form_state->getErrors()) {
    // Return form validation response with alerts
    return $ajax_builder->createFormValidationResponse($form, $form_state);
  } else {
    // Return success response
    $response = $ajax_builder->createSuccessResponse(
      'Form submitted successfully!',
      ['title' => 'Success', 'auto_dismiss' => true]
    );
    
    // Add the rebuilt form
    $response->addCommand(new ReplaceCommand('#custom-form-wrapper', $form));
    return $response;
  }
}
```

### 5. Service-Based Alert Management

```php
<?php
use Drupal\mui_base_components\Service\AlertService;

class MyCustomService {
  
  protected $alertService;
  
  public function __construct(AlertService $alert_service) {
    $this->alertService = $alert_service;
  }
  
  public function processData($data) {
    try {
      // Process data
      $result = $this->performComplexOperation($data);
      
      // Add success alert
      $this->alertService->addAlert(
        'status',
        'Data processed successfully. ' . count($result) . ' items updated.',
        [
          'title' => 'Processing Complete',
          'auto_dismiss' => true,
          'dismiss_timeout' => 5000
        ]
      );
      
      return $result;
      
    } catch (\Exception $e) {
      // Add error alert with details
      $this->alertService->addAlert(
        'error',
        'Failed to process data: ' . $e->getMessage(),
        [
          'title' => 'Processing Error',
          'auto_dismiss' => false,
          'actions' => [
            [
              'label' => 'View Log',
              'url' => '/admin/reports/dblog'
            ],
            [
              'label' => 'Contact Support',
              'click_handler' => 'openSupportDialog'
            ]
          ]
        ]
      );
      
      throw $e;
    }
  }
}
```

### 6. Event-Driven Alerts

```php
<?php
/**
 * Implements hook_entity_insert().
 */
function mymodule_entity_insert(EntityInterface $entity) {
  if ($entity->getEntityTypeId() === 'node') {
    mui_base_components_add_alert(
      'success',
      t('New @type "@title" has been created.', [
        '@type' => $entity->bundle(),
        '@title' => $entity->label()
      ]),
      [
        'title' => t('Content Created'),
        'actions' => [
          [
            'label' => t('View'),
            'url' => $entity->toUrl()->toString()
          ],
          [
            'label' => t('Edit'),
            'url' => $entity->toUrl('edit-form')->toString()
          ]
        ]
      ]
    );
  }
}

/**
 * Implements hook_user_login().
 */
function mymodule_user_login($account) {
  // Check for pending notifications
  $notifications = mymodule_get_user_notifications($account);
  
  foreach ($notifications as $notification) {
    mui_base_components_add_alert(
      $notification['type'],
      $notification['message'],
      [
        'title' => $notification['title'],
        'auto_dismiss' => $notification['auto_dismiss'] ?? true
      ]
    );
  }
}
```

## JavaScript Integration

### 7. Custom JavaScript Handlers

```javascript
// Custom click handlers for alert actions
window.retryLastAction = function() {
  // Retry the last failed action
  console.log('Retrying last action...');
  
  // Example: Re-submit form
  const form = document.querySelector('form[data-last-submit="true"]');
  if (form) {
    form.submit();
  }
  
  return false; // Prevent alert from closing
};

window.openSupportDialog = function() {
  // Open support dialog
  const dialog = document.createElement('div');
  dialog.innerHTML = `
    <div class="support-dialog">
      <h3>Contact Support</h3>
      <p>Please describe the issue you encountered:</p>
      <textarea placeholder="Describe the issue..."></textarea>
      <button onclick="submitSupportRequest()">Send</button>
    </div>
  `;
  document.body.appendChild(dialog);
  
  return true; // Allow alert to close
};

// Listen for alert events
document.addEventListener('mui:alert:added', function(e) {
  const alert = e.detail.alert;
  
  // Log alert for analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'alert_shown', {
      'alert_type': alert.severity,
      'alert_source': alert.originalType
    });
  }
});

document.addEventListener('mui:alert:dismissed', function(e) {
  const alert = e.detail.alert;
  const reason = e.detail.reason;
  
  // Track dismissal
  console.log('Alert dismissed:', alert.id, 'Reason:', reason);
});
```

### 8. Dynamic Alert Creation

```javascript
// Create alerts dynamically
function showCustomAlert(type, message, options = {}) {
  Drupal.muiAlertDrupal.addMessage(type, message, options);
}

// Example usage
showCustomAlert('info', 'Processing your request...', {
  id: 'processing-alert',
  auto_dismiss: false,
  show_progress: true
});

// Update the processing alert
setTimeout(() => {
  // Clear the processing alert
  const instance = Drupal.muiAlertDrupal.getInstance(document.body);
  if (instance) {
    instance.dismissAlert('processing-alert');
  }
  
  // Show completion alert
  showCustomAlert('success', 'Request completed successfully!');
}, 3000);
```

## Theme Integration

### 9. Custom Twig Template

```twig
{# themes/custom/mytheme/templates/mui-alert-drupal.html.twig #}
{% extends '@mui_base/mui-alert-drupal/mui-alert-drupal.twig' %}

{# Add custom header for certain positions #}
{% if position == 'top-center' %}
  {% set header_content %}
    <div class="alert-header">
      <h4>{{ 'System Messages'|t }}</h4>
    </div>
  {% endset %}
{% endif %}

{# Add custom footer with dismiss all button #}
{% set footer_content %}
  <div class="alert-footer">
    <button class="btn btn-sm" onclick="Drupal.muiAlertDrupal.clearAll()">
      {{ 'Dismiss All'|t }}
    </button>
  </div>
{% endset %}
```

### 10. CSS Customization

```css
/* Custom styling for alerts in specific contexts */
.admin-page .mui-alert-drupal {
  --mui-primary-main: #0073aa;
  --mui-error-main: #d63638;
  --mui-warning-main: #dba617;
  --mui-success-main: #46b450;
}

.admin-page .mui-alert-drupal .MuiAlert-root {
  border-left: 4px solid currentColor;
  border-radius: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Custom animations */
.mui-alert-drupal .MuiAlert-root.custom-bounce {
  animation: customBounce 0.6s ease-out;
}

@keyframes customBounce {
  0% { transform: scale(0.3) translateY(-50px); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
```

## Configuration Examples

### 11. Global Configuration

```php
<?php
// In settings.php or module install
$config = \Drupal::configFactory()->getEditable('mui_base_components.alert_settings');
$config->setData([
  'global_alerts_enabled' => TRUE,
  'global_position' => 'top-right',
  'replace_drupal_messages' => TRUE,
  'enabled_forms' => [
    'user_login_form',
    'user_register_form',
    'contact_message_feedback_form',
    'node_article_form',
    'node_page_form',
  ],
  'show_login_welcome' => TRUE,
  'show_logout_message' => TRUE,
  'default_severity_mapping' => [
    'status' => 'success',
    'warning' => 'warning',
    'error' => 'error',
    'info' => 'info',
  ],
  'default_dismiss_timeout' => [
    'success' => 5000,
    'info' => 7000,
    'warning' => 10000,
    'error' => 0,
  ]
])->save();
```

### 12. User Preferences

```php
<?php
// Allow users to customize alert behavior
function mymodule_user_preferences_form(&$form, FormStateInterface $form_state) {
  $alert_service = \Drupal::service('mui_base_components.alert_service');
  $preferences = $alert_service->getUserPreferences();
  
  $form['alerts'] = [
    '#type' => 'details',
    '#title' => t('Alert Preferences'),
  ];
  
  $form['alerts']['auto_dismiss'] = [
    '#type' => 'checkbox',
    '#title' => t('Auto-dismiss alerts'),
    '#default_value' => $preferences['auto_dismiss'] ?? TRUE,
  ];
  
  $form['alerts']['position'] = [
    '#type' => 'select',
    '#title' => t('Alert position'),
    '#default_value' => $preferences['position'] ?? 'top-right',
    '#options' => [
      'top-left' => t('Top Left'),
      'top-center' => t('Top Center'),
      'top-right' => t('Top Right'),
      'bottom-left' => t('Bottom Left'),
      'bottom-center' => t('Bottom Center'),
      'bottom-right' => t('Bottom Right'),
    ],
  ];
  
  $form['alerts']['sound_enabled'] = [
    '#type' => 'checkbox',
    '#title' => t('Enable sound notifications'),
    '#default_value' => $preferences['sound_enabled'] ?? FALSE,
  ];
  
  $form['#submit'][] = 'mymodule_save_user_preferences';
}

function mymodule_save_user_preferences(&$form, FormStateInterface $form_state) {
  $alert_service = \Drupal::service('mui_base_components.alert_service');
  
  $preferences = [
    'auto_dismiss' => $form_state->getValue('auto_dismiss'),
    'position' => $form_state->getValue('position'),
    'sound_enabled' => $form_state->getValue('sound_enabled'),
  ];
  
  $alert_service->configureUserPreferences($preferences);
  
  mui_base_components_add_alert(
    'status',
    'Your alert preferences have been saved.',
    ['title' => 'Preferences Updated']
  );
}
```

## Best Practices

### 13. Alert Management in Controllers

```php
<?php
use Drupal\Core\Controller\ControllerBase;
use Drupal\mui_base_components\Service\AlertService;

class MyController extends ControllerBase {
  
  protected $alertService;
  
  public function __construct(AlertService $alert_service) {
    $this->alertService = $alert_service;
  }
  
  public function processAction() {
    try {
      // Perform action
      $this->doSomethingComplex();
      
      // Success feedback
      $this->alertService->addAlert(
        'status',
        $this->t('Action completed successfully.'),
        [
          'title' => $this->t('Success'),
          'auto_dismiss' => TRUE
        ]
      );
      
    } catch (\Exception $e) {
      // Error feedback
      $this->alertService->addAlert(
        'error',
        $this->t('Action failed: @error', ['@error' => $e->getMessage()]),
        [
          'title' => $this->t('Error'),
          'auto_dismiss' => FALSE,
          'actions' => [
            [
              'label' => $this->t('Retry'),
              'url' => $this->getRequest()->getRequestUri()
            ]
          ]
        ]
      );
    }
    
    return $this->redirect('my_module.list');
  }
}
```

This comprehensive integration provides a robust, accessible, and user-friendly alert system that seamlessly integrates with Drupal's existing message infrastructure while providing the enhanced UX of Material Design alerts.