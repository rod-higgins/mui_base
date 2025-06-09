/**
 * @file
 * MUI Button component JavaScript.
 */

(function (Drupal) {
  'use strict';

  /**
   * Initialize MUI buttons with ripple effect.
   */
  Drupal.behaviors.muiButton = {
    attach: function (context, settings) {
      const buttons = context.querySelectorAll('.MuiButton-root:not(.js-mui-button-processed)');
      
      buttons.forEach(function (button) {
        button.classList.add('js-mui-button-processed');
        
        // Add ripple effect on click
        button.addEventListener('click', function (e) {
          if (button.classList.contains('Mui-disabled')) {
            return;
          }
          
          const ripple = button.querySelector('.MuiTouchRipple-root');
          if (ripple) {
            createRipple(e, ripple);
          }
        });

        // Keyboard accessibility
        button.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            if (button.classList.contains('Mui-disabled')) {
              e.preventDefault();
              return;
            }
            
            const ripple = button.querySelector('.MuiTouchRipple-root');
            if (ripple) {
              createRipple(e, ripple, true);
            }
          }
        });
      });
    }
  };

  /**
   * Create ripple effect.
   */
  function createRipple(event, rippleContainer, center = false) {
    const button = rippleContainer.parentNode;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    let x, y;
    
    if (center || !event.clientX || !event.clientY) {
      x = rect.width / 2 - size / 2;
      y = rect.height / 2 - size / 2;
    } else {
      x = event.clientX - rect.left - size / 2;
      y = event.clientY - rect.top - size / 2;
    }
    
    const rippleElement = document.createElement('span');
    rippleElement.className = 'MuiTouchRipple-ripple MuiTouchRipple-rippleVisible';
    rippleElement.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background-color: currentColor;
      opacity: 0;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
    `;
    
    rippleContainer.appendChild(rippleElement);
    
    // Remove ripple after animation
    setTimeout(() => {
      if (rippleElement.parentNode) {
        rippleElement.remove();
      }
    }, 550);
  }

})(Drupal);
