# MUI Base Theme

A comprehensive Drupal theme implementing Material UI design system with flexible layouts, mobile-first navigation, and extensive customization options.

## Features

### 🎨 Design System
- **Material UI Components**: Full implementation of MUI design tokens and components
- **Custom Color Palette**: Live color palette editor with preview
- **Typography System**: Material UI typography scales with custom font support
- **Dark Mode Support**: Automatic dark mode based on user preference
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts

### 📱 Mobile Navigation
- **Mobile Menu Component**: Collapsible drawer-style navigation
- **Responsive Breakpoints**: Configurable breakpoints (sm, md, lg, xl)
- **Touch-Friendly**: Optimized for touch interactions
- **Accessibility**: Full keyboard navigation and screen reader support

### 🏗️ Flexible Layouts
- **1-4 Column Layouts**: Support for 1, 2, 3, and 4 column layouts
- **Dynamic Sidebar System**: Auto-detecting sidebar configuration
- **Layout Builder Compatible**: Works seamlessly with Drupal Layout Builder
- **Responsive Grid System**: CSS Grid-based responsive layouts

### 🎛️ Admin Experience
- **Theme Settings Panel**: Comprehensive settings with live preview
- **Color Palette Editor**: Visual color picker with Material UI palette
- **Logo Management**: Support for SVG and image logos
- **Layout Configuration**: Visual layout selector with preview
- **Custom CSS Editor**: Built-in CSS editor with syntax highlighting

### ♿ Accessibility
- **WCAG 2.1 AA Compliant**: Full accessibility support
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader Support**: Semantic markup and ARIA attributes
- **High Contrast Support**: Automatic high contrast mode detection
- **Reduced Motion**: Respects user motion preferences

## Installation

1. **Download the theme** to your `themes/custom/` directory:
   ```
   web/themes/custom/mui_base/
   ```

2. **Clear cache** and enable the theme:
   ```bash
   drush cr
   drush then mui_base
   ```

3. **Configure the theme** at `/admin/appearance/settings/mui_base`

## Components

### Core Components
- **MUI Button**: Material UI styled buttons with variants and states
- **MUI Card**: Flexible card component with elevation and variants
- **MUI Typography**: Complete typography system with semantic markup
- **MUI Container**: Responsive container with max-width constraints
- **MUI Grid**: CSS Grid-based layout system
- **MUI Paper**: Surface component with elevation shadows

### Navigation Components
- **MUI Mobile Menu**: Responsive mobile navigation with drawer
- **MUI Sidebar Menu**: Collapsible sidebar navigation with nested levels
- **MUI App Bar**: Sticky header with navigation integration

### Form Components
- **MUI Input**: Styled form inputs with floating labels
- **MUI Select**: Dropdown selects with Material UI styling
- **MUI Checkbox**: Checkbox inputs with ripple effects
- **MUI Radio**: Radio button inputs with Material UI styling

## Layout System

### Available Layouts
1. **1 Column** (`1-col`): Single content column
2. **2 Column Left** (`2-col-left`): Sidebar left, content right
3. **2 Column Right** (`2-col-right`): Content left, sidebar right
4. **3 Column Left** (`3-col-left`): Two sidebars left, content right
5. **3 Column Right** (`3-col-right`): Content left, two sidebars right
6. **3 Column Center** (`3-col-center`): Sidebar, content, sidebar
7. **4 Column** (`4-col`): Mixed width columns
8. **4 Column Equal** (`4-col-equal`): Four equal width columns

### Responsive Behavior
- **Desktop**: Full layout as configured
- **Tablet** (< 1200px): Simplified to 2 columns max
- **Mobile** (< 768px): Single column stack

## Regions

### Header Regions
- `header_top`: Optional top header area
- `header`: Main header with logo and navigation
- `navigation`: Horizontal navigation menu

### Content Regions
- `content_top`: Full-width content top
- `content_top_left/center/right`: Three-column content top
- `content`: Main content area
- `sidebar_first/second/third/fourth`: Up to four sidebar regions
- `content_bottom_left/center/right`: Three-column content bottom
- `content_bottom`: Full-width content bottom

### Footer Regions
- `footer_top`: Full-width footer top
- `footer_first/second/third/fourth`: Four-column footer
- `footer_bottom`: Copyright/legal area

## Customization

### Color Palette
Configure your brand colors in the theme settings:
1. **Primary Colors**: Main brand color with light/dark variants
2. **Secondary Colors**: Accent colors for highlights
3. **Status Colors**: Error, warning, info, success states
4. **Background Colors**: Default and surface backgrounds

### Typography
Choose from:
- **Roboto** (default Material UI font)
- **System Font Stack** (native system fonts)
- **Custom Font Family** (specify your own font stack)

### Logo Configuration
- **Image Logo**: Upload PNG, JPG, or GIF
- **SVG Logo**: Paste SVG markup for scalable logos
- **Size Constraints**: Set maximum width and height

### Advanced Settings
- **Dark Mode**: Enable automatic dark theme switching
- **Animations**: Toggle Material UI animations
- **Ripple Effects**: Enable/disable touch ripple effects
- **Compact Mode**: Reduce spacing for dense layouts

## Development

### File Structure
```
mui_base/
├── components/          # Single Directory Components
│   ├── mui-button/     # Button component
│   ├── mui-card/       # Card component
│   ├── mui-mobile-menu/ # Mobile navigation
│   └── mui-sidebar-menu/ # Sidebar navigation
├── css/                # Global styles
│   ├── base.css        # Base styles and reset
│   ├── layout.css      # Layout system
│   ├── mui-theme.css   # Material UI theme variables
│   └── components.css  # Component overrides
├── js/                 # JavaScript functionality
│   ├── mui-base.js     # Core theme JavaScript
│   └── admin/          # Admin interface scripts
├── templates/          # Twig templates
│   ├── layout/         # Layout templates
│   ├── content/        # Content templates
│   └── form/           # Form templates
└── config/             # Configuration files
```

### CSS Custom Properties
The theme uses CSS custom properties for theming:
```css
:root {
  --mui-primary-main: #1976d2;
  --mui-secondary-main: #dc004e;
  --mui-spacing-1: 8px;
  --mui-border-radius: 4px;
  /* ... and many more */
}
```

### JavaScript API
Access theme functionality programmatically:
```javascript
// Mobile menu
const mobileMenu = Drupal.muiMobileMenu.getInstance(element);
mobileMenu.open();

// Sidebar menu
const sidebarMenu = Drupal.muiSidebarMenu.getInstance(element);
sidebarMenu.expandAll();

// Ripple effects
Drupal.mui.createRipple(element, event);
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **CSS Grid**: Required for layout system
- **CSS Custom Properties**: Required for theming
- **ES6+**: Modern JavaScript features used

## Performance

- **CSS Grid**: Efficient layout rendering
- **CSS Custom Properties**: Dynamic theming without recompilation
- **Minimal JavaScript**: Progressive enhancement approach
- **Optimized Assets**: Compressed and minified in production

## Accessibility Features

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Attributes**: Complete ARIA labeling for interactive elements
- **Keyboard Navigation**: Full keyboard accessibility for all components
- **Screen Reader Support**: Descriptive text and announcements
- **Color Contrast**: WCAG AA compliant color combinations
- **Focus Management**: Visible focus indicators and logical tab order
- **Reduced Motion**: Respects user motion preferences

## Contributing

1. **Code Style**: Follow Drupal coding standards
2. **Testing**: Test across supported browsers and devices
3. **Accessibility**: Ensure WCAG 2.1 AA compliance
4. **Documentation**: Update documentation for new features

## Support

For issues and feature requests, please use the project's issue tracker.

## License

This theme is licensed under the GPL v2 or later.