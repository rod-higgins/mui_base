<?php

/**
 * @file
 * Improved theme settings form for MUI Base theme with enhanced security.
 */

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;

/**
 * Implements hook_form_FORM_ID_alter() for system_theme_settings.
 */
function mui_base_form_system_theme_settings_alter(&$form, FormStateInterface $form_state) {
  $theme_settings = \Drupal::config('mui_base.settings');
  
  // Create main fieldset
  $form['mui_base'] = [
    '#type' => 'details',
    '#title' => t('MUI Base Theme Settings'),
    '#open' => TRUE,
    '#weight' => -10,
  ];
  
  // Brand Settings
  $form['mui_base']['brand_settings'] = [
    '#type' => 'details',
    '#title' => t('Brand Configuration'),
    '#open' => TRUE,
    '#description' => t('Configure your brand identity and styling.'),
  ];
  
  $form['mui_base']['brand_settings']['brand_name'] = [
    '#type' => 'textfield',
    '#title' => t('Brand Name'),
    '#default_value' => $theme_settings->get('brand_name') ?: '',
    '#description' => t('Your organization or brand name for internal reference.'),
    '#maxlength' => 100,
  ];
  
  $form['mui_base']['brand_settings']['brand_class'] = [
    '#type' => 'textfield',
    '#title' => t('Brand CSS Class'),
    '#default_value' => $theme_settings->get('brand_class') ?: '',
    '#description' => t('Optional CSS class to add to the body element for custom styling (e.g., "my-company-brand"). Use only letters, numbers, hyphens, and underscores.'),
    '#maxlength' => 50,
    '#pattern' => '[a-zA-Z0-9\-_]+',
  ];
  
  // Logo Settings
  $form['mui_base']['logo_settings'] = [
    '#type' => 'details',
    '#title' => t('Logo Configuration'),
    '#open' => TRUE,
  ];
  
  $form['mui_base']['logo_settings']['logo_type'] = [
    '#type' => 'radios',
    '#title' => t('Logo Type'),
    '#options' => [
      'image' => t('Image (PNG, JPG, GIF)'),
      'svg' => t('SVG Markup'),
    ],
    '#default_value' => $theme_settings->get('logo_type') ?: 'image',
    '#description' => t('Choose whether to use an uploaded image or SVG markup.'),
  ];
  
  $form['mui_base']['logo_settings']['svg_logo'] = [
    '#type' => 'textarea',
    '#title' => t('SVG Logo Markup'),
    '#default_value' => $theme_settings->get('svg_logo') ?: '',
    '#description' => t('Paste clean SVG markup here. JavaScript and dangerous attributes will be stripped for security.'),
    '#rows' => 8,
    '#states' => [
      'visible' => [
        ':input[name="logo_type"]' => ['value' => 'svg'],
      ],
    ],
  ];
  
  $form['mui_base']['logo_settings']['logo_dimensions'] = [
    '#type' => 'fieldset',
    '#title' => t('Logo Dimensions'),
  ];
  
  $form['mui_base']['logo_settings']['logo_dimensions']['logo_max_width'] = [
    '#type' => 'number',
    '#title' => t('Maximum Width (px)'),
    '#default_value' => $theme_settings->get('logo_max_width') ?: 120,
    '#min' => 10,
    '#max' => 500,
    '#step' => 1,
  ];
  
  $form['mui_base']['logo_settings']['logo_dimensions']['logo_max_height'] = [
    '#type' => 'number',
    '#title' => t('Maximum Height (px)'),
    '#default_value' => $theme_settings->get('logo_max_height') ?: 40,
    '#min' => 10,
    '#max' => 200,
    '#step' => 1,
  ];
  
  // Layout Settings
  $form['mui_base']['layout_settings'] = [
    '#type' => 'details',
    '#title' => t('Layout Configuration'),
    '#open' => TRUE,
  ];
  
  $form['mui_base']['layout_settings']['default_layout'] = [
    '#type' => 'select',
    '#title' => t('Default Layout'),
    '#options' => [
      'centered' => t('Centered Layout (Recommended)'),
      'auto' => t('Auto-detect from Content'),
      '1-col' => t('Single Column'),
      '2-col-left' => t('Two Column (Left Sidebar)'),
      '2-col-right' => t('Two Column (Right Sidebar)'),
      '3-col-left' => t('Three Column (Left Sidebars)'),
      '3-col-right' => t('Three Column (Right Sidebars)'),
      '3-col-center' => t('Three Column (Content Center)'),
      '4-col' => t('Four Column (Mixed)'),
      '4-col-equal' => t('Four Column (Equal Width)'),
    ],
    '#default_value' => $theme_settings->get('default_layout') ?: 'centered',
    '#description' => t('<strong>Centered Layout</strong> provides optimal UX with horizontal navigation. <strong>Auto-detect</strong> chooses layout based on active sidebars.'),
  ];
  
  $form['mui_base']['layout_settings']['mobile_breakpoint'] = [
    '#type' => 'select',
    '#title' => t('Mobile Menu Breakpoint'),
    '#options' => [
      'sm' => t('Small (600px)'),
      'md' => t('Medium (900px) - Recommended'),
      'lg' => t('Large (1200px)'),
      'xl' => t('Extra Large (1536px)'),
    ],
    '#default_value' => $theme_settings->get('mobile_breakpoint') ?: 'md',
    '#description' => t('Screen width below which mobile menu activates.'),
  ];
  
  $form['mui_base']['layout_settings']['sticky_header'] = [
    '#type' => 'checkbox',
    '#title' => t('Sticky Header'),
    '#default_value' => $theme_settings->get('sticky_header') ?? TRUE,
    '#description' => t('Header remains visible when scrolling.'),
  ];
  
  // Color Palette - Organized by brand hierarchy
  $form['mui_base']['brand_colors'] = [
    '#type' => 'details',
    '#title' => t('Brand Color Palette'),
    '#open' => TRUE,
    '#description' => t('Configure your brand colors with accessibility-compliant combinations.'),
  ];
  
  // Primary Brand Colors
  _mui_base_add_color_group($form['mui_base']['brand_colors'], 'primary', 
    t('Primary Colors (Deep Teal)'), 
    t('Main brand colors for headers, primary buttons, and key interface elements.'),
    [
      'main' => ['#00303c', t('Main teal for headers and primary buttons')],
      'light' => ['#335963', t('Lighter teal for hover states')],
      'dark' => ['#00212A', t('Darker teal for active states')],
    ],
    $theme_settings
  );
  
  // Secondary Brand Colors
  _mui_base_add_color_group($form['mui_base']['brand_colors'], 'secondary',
    t('Secondary Colors (Green)'),
    t('Action colors for buttons, success states, and positive interactions.'),
    [
      'main' => ['#76BD22', t('Main green for action buttons')],
      'light' => ['#91CA4E', t('Light green for subtle backgrounds')],
      'dark' => ['#528417', t('Dark green for emphasis')],
    ],
    $theme_settings
  );
  
  // Tertiary Colors
  _mui_base_add_color_group($form['mui_base']['brand_colors'], 'tertiary',
    t('Tertiary Colors (Light Grey)'),
    t('Neutral colors for backgrounds, borders, and subtle elements.'),
    [
      'main' => ['#E7ECEB', t('Main tertiary for subtle backgrounds')],
      'light' => ['#EBEFEF', t('Very light grey for minimal backgrounds')],
      'dark' => ['#A1A5A4', t('Darker grey for borders and muted text')],
    ],
    $theme_settings
  );
  
  // Status Colors
  $form['mui_base']['status_colors'] = [
    '#type' => 'details',
    '#title' => t('Status Colors'),
    '#open' => FALSE,
  ];
  
  $status_colors = [
    'error_main' => ['#f44336', t('Error messages and states')],
    'warning_main' => ['#ff9800', t('Warning messages and states')],
    'info_main' => ['#2196f3', t('Informational messages')],
  ];
  
  foreach ($status_colors as $key => [$default, $description]) {
    $form['mui_base']['status_colors'][$key] = [
      '#type' => 'color',
      '#title' => t(ucfirst(str_replace(['_main', '_'], ['', ' '], $key))),
      '#default_value' => $theme_settings->get($key) ?: $default,
      '#description' => $description,
    ];
  }
  
  $form['mui_base']['status_colors']['success_note'] = [
    '#type' => 'markup',
    '#markup' => '<p><em>' . t('Success states automatically use Secondary Green for brand consistency.') . '</em></p>',
  ];
  
  // Background Colors
  $form['mui_base']['background_colors'] = [
    '#type' => 'details',
    '#title' => t('Background & Surface'),
    '#open' => FALSE,
  ];
  
  $form['mui_base']['background_colors']['background_default'] = [
    '#type' => 'color',
    '#title' => t('Default Background'),
    '#default_value' => $theme_settings->get('background_default') ?: '#fafafa',
    '#description' => t('Main page background color.'),
  ];
  
  $form['mui_base']['background_colors']['background_paper'] = [
    '#type' => 'color',
    '#title' => t('Paper Background'),
    '#default_value' => $theme_settings->get('background_paper') ?: '#ffffff',
    '#description' => t('Card and content area background.'),
  ];
  
  // Typography
  $form['mui_base']['typography'] = [
    '#type' => 'details',
    '#title' => t('Typography'),
    '#open' => FALSE,
  ];
  
  $form['mui_base']['typography']['font_family'] = [
    '#type' => 'select',
    '#title' => t('Font Family'),
    '#options' => [
      'roboto' => t('Roboto (Material Design)'),
      'system' => t('System Font Stack'),
      'custom' => t('Custom Font Family'),
    ],
    '#default_value' => $theme_settings->get('font_family') ?: 'roboto',
  ];
  
  $form['mui_base']['typography']['custom_font_family'] = [
    '#type' => 'textfield',
    '#title' => t('Custom Font Family'),
    '#default_value' => $theme_settings->get('custom_font_family') ?: '',
    '#description' => t('Enter font family stack (e.g., "Inter", "Helvetica Neue", sans-serif).'),
    '#maxlength' => 255,
    '#states' => [
      'visible' => [
        ':input[name="font_family"]' => ['value' => 'custom'],
      ],
      'required' => [
        ':input[name="font_family"]' => ['value' => 'custom'],
      ],
    ],
  ];
  
  $form['mui_base']['typography']['font_size_base'] = [
    '#type' => 'range',
    '#title' => t('Base Font Size'),
    '#default_value' => $theme_settings->get('font_size_base') ?: 1.0,
    '#min' => 0.75,
    '#max' => 1.5,
    '#step' => 0.05,
    '#description' => t('Base font size in rem units (1.0 = 16px typically).'),
    '#field_suffix' => ' rem',
  ];
  
  // Advanced Settings
  $form['mui_base']['advanced'] = [
    '#type' => 'details',
    '#title' => t('Advanced Options'),
    '#open' => FALSE,
  ];
  
  $form['mui_base']['advanced']['enable_dark_mode'] = [
    '#type' => 'checkbox',
    '#title' => t('Dark Mode Support'),
    '#default_value' => $theme_settings->get('enable_dark_mode') ?? FALSE,
    '#description' => t('Automatically switch to dark theme based on user preference.'),
  ];
  
  $form['mui_base']['advanced']['enable_animations'] = [
    '#type' => 'checkbox',
    '#title' => t('Enable Animations'),
    '#default_value' => $theme_settings->get('enable_animations') ?? TRUE,
    '#description' => t('Material UI transitions and animations (respects prefers-reduced-motion).'),
  ];
  
  $form['mui_base']['advanced']['enable_ripple'] = [
    '#type' => 'checkbox',
    '#title' => t('Ripple Effects'),
    '#default_value' => $theme_settings->get('enable_ripple') ?? TRUE,
    '#description' => t('Touch ripple effects on interactive elements.'),
  ];
  
  $form['mui_base']['advanced']['compact_mode'] = [
    '#type' => 'checkbox',
    '#title' => t('Compact Mode'),
    '#default_value' => $theme_settings->get('compact_mode') ?? FALSE,
    '#description' => t('Reduced spacing for denser layouts.'),
  ];
  
  // Custom CSS with security warning
  $form['mui_base']['custom_css'] = [
    '#type' => 'details',
    '#title' => t('Custom CSS'),
    '#open' => FALSE,
  ];
  
  $form['mui_base']['custom_css']['css_warning'] = [
    '#type' => 'markup',
    '#markup' => '<div class="messages messages--warning">' . 
      t('<strong>Security Notice:</strong> Custom CSS will be automatically sanitized to remove potentially dangerous content (JavaScript, imports, expressions).') . 
      '</div>',
  ];
  
  $form['mui_base']['custom_css']['custom_css_code'] = [
    '#type' => 'textarea',
    '#title' => t('Additional CSS'),
    '#default_value' => $theme_settings->get('custom_css_code') ?: '',
    '#description' => t('Add custom CSS. Use CSS custom properties (variables) for best integration.'),
    '#rows' => 12,
    '#attributes' => [
      'style' => 'font-family: "Monaco", "Consolas", monospace; font-size: 13px;',
      'spellcheck' => 'false',
    ],
  ];
  
  // Add live preview container
  $form['mui_base']['preview'] = [
    '#type' => 'markup',
    '#markup' => '<div id="mui-palette-preview"></div>',
    '#weight' => 100,
  ];
  
  // Attach admin library
  $form['#attached']['library'][] = 'mui_base/admin';
  
  // Add validation and submit handlers
  $form['#validate'][] = 'mui_base_theme_settings_validate';
  $form['#submit'][] = 'mui_base_theme_settings_submit';
  
  return $form;
}

/**
 * Helper function to add color group fieldsets.
 */
function _mui_base_add_color_group(&$form, $group, $title, $description, $colors, $theme_settings) {
  $form[$group] = [
    '#type' => 'details',
    '#title' => $title,
    '#description' => $description,
    '#open' => TRUE,
  ];
  
  foreach ($colors as $variant => [$default, $desc]) {
    $key = "{$group}_{$variant}";
    $form[$group][$key] = [
      '#type' => 'color',
      '#title' => t(ucfirst($variant)),
      '#default_value' => $theme_settings->get($key) ?: $default,
      '#description' => $desc,
    ];
  }
}

/**
 * Validation handler for theme settings.
 */
function mui_base_theme_settings_validate($form, FormStateInterface $form_state) {
  $values = $form_state->getValues();
  
  // Validate logo dimensions
  $max_width = $values['logo_max_width'];
  $max_height = $values['logo_max_height'];
  
  if (!is_numeric($max_width) || $max_width < 10 || $max_width > 500) {
    $form_state->setErrorByName('logo_max_width', t('Logo width must be between 10 and 500 pixels.'));
  }
  
  if (!is_numeric($max_height) || $max_height < 10 || $max_height > 200) {
    $form_state->setErrorByName('logo_max_height', t('Logo height must be between 10 and 200 pixels.'));
  }
  
  // Validate SVG logo if provided
  if ($values['logo_type'] === 'svg' && !empty($values['svg_logo'])) {
    $svg = trim($values['svg_logo']);
    if (!preg_match('/^\s*<svg/i', $svg)) {
      $form_state->setErrorByName('svg_logo', t('SVG markup must start with an &lt;svg&gt; tag.'));
    }
    if (preg_match('/<script/i', $svg)) {
      $form_state->setErrorByName('svg_logo', t('SVG markup cannot contain script tags for security reasons.'));
    }
  }
  
  // Validate custom font family
  if ($values['font_family'] === 'custom') {
    $custom_font = trim($values['custom_font_family']);
    if (empty($custom_font)) {
      $form_state->setErrorByName('custom_font_family', t('Custom font family is required when "Custom" is selected.'));
    } elseif (strlen($custom_font) > 255) {
      $form_state->setErrorByName('custom_font_family', t('Font family cannot exceed 255 characters.'));
    }
  }
  
  // Validate color values
  $color_fields = [
    'primary_main', 'primary_light', 'primary_dark',
    'secondary_main', 'secondary_light', 'secondary_dark',
    'tertiary_main', 'tertiary_light', 'tertiary_dark',
    'error_main', 'warning_main', 'info_main',
    'background_default', 'background_paper'
  ];
  
  foreach ($color_fields as $field) {
    if (!empty($values[$field]) && !preg_match('/^#[0-9a-fA-F]{6}$/', $values[$field])) {
      $form_state->setErrorByName($field, t('Invalid color format for @field. Use 6-digit hex codes (e.g., #ff0000).', ['@field' => $field]));
    }
  }
  
  // Validate font size
  $font_size = $values['font_size_base'];
  if (!is_numeric($font_size) || $font_size < 0.75 || $font_size > 1.5) {
    $form_state->setErrorByName('font_size_base', t('Font size must be between 0.75 and 1.5 rem.'));
  }
}

/**
 * Enhanced submit handler with proper sanitization.
 */
function mui_base_theme_settings_submit($form, FormStateInterface $form_state) {
  $config = \Drupal::configFactory()->getEditable('mui_base.settings');
  $values = $form_state->getValues();
  
  // Sanitize and save logo settings
  $config->set('logo_type', in_array($values['logo_type'], ['image', 'svg'], TRUE) ? $values['logo_type'] : 'image');
  
  // Sanitize SVG logo
  if ($values['logo_type'] === 'svg' && !empty($values['svg_logo'])) {
    $svg_logo = $values['svg_logo'];
    // Remove dangerous elements and attributes
    $svg_logo = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $svg_logo);
    $svg_logo = preg_replace('/on\w+\s*=/i', '', $svg_logo);
    $svg_logo = preg_replace('/javascript\s*:/i', '', $svg_logo);
    $config->set('svg_logo', $svg_logo);
  } else {
    $config->set('svg_logo', '');
  }
  
  $config->set('logo_max_width', (int) $values['logo_max_width']);
  $config->set('logo_max_height', (int) $values['logo_max_height']);
  
  // Layout settings with validation
  $allowed_layouts = [
    'centered', 'auto', '1-col', '2-col-left', '2-col-right',
    '3-col-left', '3-col-right', '3-col-center', '4-col', '4-col-equal'
  ];
  $layout = in_array($values['default_layout'], $allowed_layouts, TRUE) ? 
    $values['default_layout'] : 'centered';
  $config->set('default_layout', $layout);
  
  $allowed_breakpoints = ['sm', 'md', 'lg', 'xl'];
  $breakpoint = in_array($values['mobile_breakpoint'], $allowed_breakpoints, TRUE) ? 
    $values['mobile_breakpoint'] : 'md';
  $config->set('mobile_breakpoint', $breakpoint);
  
  $config->set('sticky_header', (bool) $values['sticky_header']);
  
  // Color settings with validation
  $color_fields = [
    'primary_main', 'primary_light', 'primary_dark',
    'secondary_main', 'secondary_light', 'secondary_dark',
    'tertiary_main', 'tertiary_light', 'tertiary_dark',
    'error_main', 'warning_main', 'info_main',
    'background_default', 'background_paper'
  ];
  
  foreach ($color_fields as $field) {
    $value = $values[$field] ?? '';
    if (!empty($value) && preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
      $config->set($field, $value);
    }
  }
  
  // Typography settings
  $allowed_fonts = ['roboto', 'system', 'custom'];
  $font_family = in_array($values['font_family'], $allowed_fonts, TRUE) ? 
    $values['font_family'] : 'roboto';
  $config->set('font_family', $font_family);
  
  if ($font_family === 'custom' && !empty($values['custom_font_family'])) {
    // Sanitize custom font family
    $custom_font = preg_replace('/[^a-zA-Z0-9\s\-_,\'"()]/', '', $values['custom_font_family']);
    $config->set('custom_font_family', substr($custom_font, 0, 255));
  } else {
    $config->set('custom_font_family', '');
  }
  
  $font_size = (float) $values['font_size_base'];
  if ($font_size >= 0.75 && $font_size <= 1.5) {
    $config->set('font_size_base', $font_size);
  }
  
  // Advanced settings
  $config->set('enable_dark_mode', (bool) $values['enable_dark_mode']);
  $config->set('enable_animations', (bool) $values['enable_animations']);
  $config->set('enable_ripple', (bool) $values['enable_ripple']);
  $config->set('compact_mode', (bool) $values['compact_mode']);
  
  // Custom CSS with sanitization
  if (!empty($values['custom_css_code'])) {
    $custom_css = $values['custom_css_code'];
    // Remove potentially dangerous CSS
    $custom_css = preg_replace('/javascript\s*:/i', '', $custom_css);
    $custom_css = preg_replace('/expression\s*\(/i', '', $custom_css);
    $custom_css = preg_replace('/@import\s+/i', '', $custom_css);
    $custom_css = preg_replace('/behavior\s*:/i', '', $custom_css);
    $config->set('custom_css_code', $custom_css);
  } else {
    $config->set('custom_css_code', '');
  }
  
  $config->save();
  
  // Clear relevant caches
  \Drupal::service('theme.registry')->reset();
  \Drupal::service('asset.css.collection_optimizer')->deleteAll();
  \Drupal::service('asset.js.collection_optimizer')->deleteAll();
  
  // Clear menu cache
  \Drupal::cache()->delete('mui_base:navigation_menu');
  \Drupal::cache()->deleteMultiple(['mui_menu_context:main', 'mui_menu_context:sidebar']);
  
  \Drupal::messenger()->addMessage(t('MUI Base theme settings saved successfully. Cache cleared automatically.'));
}