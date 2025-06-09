/**
 * @file
 * Ripple effect component.
 */

(function (Drupal) {
  'use strict';

  Drupal.behaviors.muiRipple = {
    attach: function (context, settings) {
      const rippleElements = context.querySelectorAll('.MuiTouchRipple-root:not(.js-ripple-effect-processed)');
      
      rippleElements.forEach(function (rippleContainer) {
        rippleContainer.classList.add('js-ripple-effect-processed');
        
        const button = rippleContainer.parentNode;
        
        button.addEventListener('mousedown', function (e) {
          Drupal.mui.createRipple(button, e);
        });
        
        button.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            Drupal.mui.createRipple(button, e, true);
          }
        });
      });
    }
  };

})(Drupal);
