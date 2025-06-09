/**
 * @file
 * Theme settings JavaScript for live preview functionality.
 */

(function ($, Drupal, drupalSettings) {
  'use strict';

  /**
   * Live preview for theme settings.
   */
  Drupal.behaviors.muiThemeSettings = {
    attach: function (context, settings) {
      const $context = $(context);
      
      // Initialize color picker previews
      initializeColorPickers($context);
      
      // Initialize live preview
      initializeLivePreview($context);
      
      // Initialize palette preview
      initializePalettePreview($context);
      
      // Initialize logo preview
      initializeLogoPreview($context);
      
      // Initialize layout preview
      initializeLayoutPreview($context);
    }
  };

  /**
   * Initialize color picker functionality.
   */
  function initializeColorPickers($context) {
    const colorInputs = $context.find('input[type="color"]').once('mui-color-picker');
    
    colorInputs.each(function () {
      const $input = $(this);
      const $wrapper = $('<div class="mui-color-picker-wrapper"></div>');
      const $preview = $('<div class="mui-color-preview"></div>');
      const $label = $('<span class="mui-color-label"></span>');
      
      $wrapper.append($preview, $label);
      $input.after($wrapper);
      
      // Update preview
      function updatePreview() {
        const color = $input.val();
        $preview.css('background-color', color);
        $label.text(color.toUpperCase());
      }
      
      // Initial update
      updatePreview();
      
      // Listen for changes
      $input.on('input change', updatePreview);
    });
  }

  /**
   * Initialize live preview functionality.
   */
  function initializeLivePreview($context) {
    const $form = $context.find('#system-theme-settings').once('mui-live-preview');
    if (!$form.length) return;
    
    // Create live preview iframe (if we want to show live changes)
    const $previewContainer = $('<div id="mui-live-preview" style="display: none;"></div>');
    $form.append($previewContainer);
    
    // Watch for form changes
    $form.on('change input', 'input, select, textarea', function () {
      const $field = $(this);
      const fieldName = $field.attr('name');
      const value = $field.val();
      
      // Handle different field types
      switch (fieldName) {
        case 'primary_main':
        case 'primary_light':
        case 'primary_dark':
        case 'secondary_main':
        case 'secondary_light':
        case 'secondary_dark':
          updateColorVariable(fieldName, value);
          break;
          
        case 'logo_type':
          toggleLogoFields(value);
          break;
          
        case 'svg_logo':
          updateSVGPreview(value);
          break;
          
        case 'default_layout':
          updateLayoutPreview(value);
          break;
      }
      
      // Update palette preview
      updatePalettePreview();
    });
  }

  /**
   * Update CSS custom properties for live preview.
   */
  function updateColorVariable(property, value) {
    const cssVar = '--mui-' + property.replace('_', '-');
    document.documentElement.style.setProperty(cssVar, value);
  }

  /**
   * Toggle logo type fields.
   */
  function toggleLogoFields(logoType) {
    const $svgField = $('[name="svg_logo"]').closest('.form-item');
    const $logoUpload = $('.form-item-logo-upload');
    
    if (logoType === 'svg') {
      $svgField.show();
      $logoUpload.hide();
    } else {
      $svgField.hide();
      $logoUpload.show();
    }
  }

  /**
   * Update SVG logo preview.
   */
  function updateSVGPreview(svgCode) {
    let $preview = $('#svg-logo-preview');
    if (!$preview.length) {
      $preview = $('<div id="svg-logo-preview" style="margin-top: 10px; padding: 10px; border: 1px solid #ccc; max-width: 200px;"></div>');
      $('[name="svg_logo"]').after($preview);
    }
    
    if (svgCode && svgCode.trim().startsWith('<svg')) {
      $preview.html(svgCode).show();
    } else {
      $preview.hide();
    }
  }

  /**
   * Initialize palette preview.
   */
  function initializePalettePreview($context) {
    const $container = $context.find('#mui-palette-preview').once('mui-palette-preview');
    if (!$container.length) return;
    
    const template = `
      <div class="mui-palette-preview-container">
        <h4>Color Palette Preview</h4>
        <div class="mui-palette-grid">
          <div class="mui-color-card" data-color="primary">
            <div class="mui-color-swatch primary-main"></div>
            <div class="mui-color-info">
              <strong>Primary</strong>
              <span class="mui-color-values">
                <small class="primary-main-value"></small>
              </span>
            </div>
          </div>
          <div class="mui-color-card" data-color="secondary">
            <div class="mui-color-swatch secondary-main"></div>
            <div class="mui-color-info">
              <strong>Secondary</strong>
              <span class="mui-color-values">
                <small class="secondary-main-value"></small>
              </span>
            </div>
          </div>
          <div class="mui-color-card" data-color="error">
            <div class="mui-color-swatch error-main"></div>
            <div class="mui-color-info">
              <strong>Error</strong>
              <span class="mui-color-values">
                <small class="error-main-value"></small>
              </span>
            </div>
          </div>
          <div class="mui-color-card" data-color="warning">
            <div class="mui-color-swatch warning-main"></div>
            <div class="mui-color-info">
              <strong>Warning</strong>
              <span class="mui-color-values">
                <small class="warning-main-value"></small>
              </span>
            </div>
          </div>
          <div class="mui-color-card" data-color="info">
            <div class="mui-color-swatch info-main"></div>
            <div class="mui-color-info">
              <strong>Info</strong>
              <span class="mui-color-values">
                <small class="info-main-value"></small>
              </span>
            </div>
          </div>
          <div class="mui-color-card" data-color="success">
            <div class="mui-color-swatch success-main"></div>
            <div class="mui-color-info">
              <strong>Success</strong>
              <span class="mui-color-values">
                <small class="success-main-value"></small>
              </span>
            </div>
          </div>
        </div>
        <div class="mui-component-preview">
          <h5>Component Preview</h5>
          <div class="mui-preview-buttons">
            <button type="button" class="mui-preview-btn mui-preview-btn-primary">Primary Button</button>
            <button type="button" class="mui-preview-btn mui-preview-btn-secondary">Secondary Button</button>
            <button type="button" class="mui-preview-btn mui-preview-btn-outlined">Outlined Button</button>
          </div>
          <div class="mui-preview-alerts">
            <div class="mui-preview-alert mui-alert-success">Success message</div>
            <div class="mui-preview-alert mui-alert-warning">Warning message</div>
            <div class="mui-preview-alert mui-alert-error">Error message</div>
            <div class="mui-preview-alert mui-alert-info">Info message</div>
          </div>
        </div>
      </div>
    `;
    
    $container.html(template);
    updatePalettePreview();
  }

  /**
   * Update palette preview with current colors.
   */
  function updatePalettePreview() {
    const colors = [
      'primary_main', 'secondary_main', 'error_main', 
      'warning_main', 'info_main', 'success_main'
    ];
    
    colors.forEach(function (colorName) {
      const $input = $(`[name="${colorName}"]`);
      if ($input.length) {
        const color = $input.val();
        const className = colorName.replace('_', '-');
        
        // Update swatch
        $(`.${className}`).css('background-color', color);
        
        // Update value display
        $(`.${className}-value`).text(color.toUpperCase());
        
        // Update component previews
        updateComponentPreviews(colorName, color);
      }
    });
  }

  /**
   * Update component previews with current colors.
   */
  function updateComponentPreviews(colorName, color) {
    switch (colorName) {
      case 'primary_main':
        $('.mui-preview-btn-primary').css({
          'background-color': color,
          'border-color': color
        });
        break;
        
      case 'secondary_main':
        $('.mui-preview-btn-secondary').css({
          'background-color': color,
          'border-color': color
        });
        break;
        
      case 'error_main':
        $('.mui-alert-error').css('border-left-color', color);
        break;
        
      case 'warning_main':
        $('.mui-alert-warning').css('border-left-color', color);
        break;
        
      case 'info_main':
        $('.mui-alert-info').css('border-left-color', color);
        break;
        
      case 'success_main':
        $('.mui-alert-success').css('border-left-color', color);
        break;
    }
  }

  /**
   * Initialize layout preview.
   */
  function initializeLayoutPreview($context) {
    const $layoutSelect = $context.find('[name="default_layout"]').once('mui-layout-preview');
    if (!$layoutSelect.length) return;
    
    const $preview = $('<div id="mui-layout-preview"></div>');
    $layoutSelect.after($preview);
    
    function updateLayoutPreview(layout) {
      const layouts = {
        '1-col': '<div class="layout-preview layout-1-col"><div class="content">Content</div></div>',
        '2-col-left': '<div class="layout-preview layout-2-col"><div class="sidebar">Sidebar</div><div class="content">Content</div></div>',
        '2-col-right': '<div class="layout-preview layout-2-col"><div class="content">Content</div><div class="sidebar">Sidebar</div></div>',
        '3-col-left': '<div class="layout-preview layout-3-col"><div class="sidebar">Sidebar 1</div><div class="sidebar">Sidebar 2</div><div class="content">Content</div></div>',
        '3-col-right': '<div class="layout-preview layout-3-col"><div class="content">Content</div><div class="sidebar">Sidebar 1</div><div class="sidebar">Sidebar 2</div></div>',
        '3-col-center': '<div class="layout-preview layout-3-col"><div class="sidebar">Sidebar 1</div><div class="content">Content</div><div class="sidebar">Sidebar 2</div></div>',
        '4-col': '<div class="layout-preview layout-4-col"><div class="sidebar">S1</div><div class="sidebar">S2</div><div class="content">Content</div><div class="sidebar">S3</div></div>',
        '4-col-equal': '<div class="layout-preview layout-4-col-equal"><div class="content">Col 1</div><div class="content">Col 2</div><div class="content">Col 3</div><div class="content">Col 4</div></div>'
      };
      
      $preview.html(layouts[layout] || layouts['1-col']);
    }
    
    // Initial update
    updateLayoutPreview($layoutSelect.val());
    
    // Listen for changes
    $layoutSelect.on('change', function () {
      updateLayoutPreview($(this).val());
    });
  }

  /**
   * Initialize logo preview.
   */
  function initializeLogoPreview($context) {
    const $logoType = $context.find('[name="logo_type"]');
    const $svgLogo = $context.find('[name="svg_logo"]');
    
    // Initial state
    toggleLogoFields($logoType.val());
    
    // Update SVG preview on input
    $svgLogo.on('input', function () {
      updateSVGPreview($(this).val());
    });
    
    // Initial SVG preview
    if ($svgLogo.val()) {
      updateSVGPreview($svgLogo.val());
    }
  }

  /**
   * Export color palette as CSS custom properties.
   */
  function exportPalette() {
    const colors = [
      'primary_main', 'primary_light', 'primary_dark',
      'secondary_main', 'secondary_light', 'secondary_dark',
      'error_main', 'warning_main', 'info_main', 'success_main',
      'background_default', 'background_paper'
    ];
    
    let css = ':root {\n';
    colors.forEach(function (colorName) {
      const $input = $(`[name="${colorName}"]`);
      if ($input.length) {
        const cssVar = '--mui-' + colorName.replace('_', '-');
        css += `  ${cssVar}: ${$input.val()};\n`;
      }
    });
    css += '}';
    
    return css;
  }

  /**
   * Copy palette CSS to clipboard.
   */
  function copyPaletteCSS() {
    const css = exportPalette();
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(css).then(function () {
        Drupal.announce('Color palette CSS copied to clipboard!');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = css;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      Drupal.announce('Color palette CSS copied to clipboard!');
    }
  }

  // Make functions available globally
  window.MuiThemeSettings = {
    exportPalette: exportPalette,
    copyPaletteCSS: copyPaletteCSS,
    updatePalettePreview: updatePalettePreview
  };

})(jQuery, Drupal, drupalSettings);