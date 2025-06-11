# MUI Base Theme for Drupal 11

A comprehensive Drupal theme implementing Google's Material UI design system with flexible layouts, mobile-first navigation, and extensive customization options.

## 🌟 Key Features

### 🎨 Material UI Design System
- **Complete MUI Implementation**: Full implementation of Material UI design tokens, components, and interaction patterns
- **Dynamic Color Palette**: Live color palette editor with real-time preview and automatic light/dark variants
- **Typography System**: Material UI typography scales with support for Roboto, system fonts, or custom font families
- **Elevation & Shadows**: Consistent shadow system with 8 elevation levels
- **Dark Mode Support**: Automatic dark mode switching based on user preference with seamless transitions

### 📱 Advanced Navigation
- **Mobile Menu Component**: Collapsible drawer-style navigation with touch gestures and smooth animations
- **Desktop Navigation**: Horizontal navigation with dropdown submenus and hover effects
- **Responsive Breakpoints**: Configurable breakpoints (sm: 768px, md: 1200px, lg: 1440px, xl: 1920px)
- **Keyboard Navigation**: Complete keyboard accessibility with focus management
- **Touch-Friendly**: Optimized for touch interactions with appropriate hit targets

### 🏗️ Flexible Layout System
- **8 Layout Options**: Support for 1-4 column layouts with multiple configurations
- **Dynamic Sidebar Detection**: Automatic layout adjustment based on active regions
- **Layout Builder Integration**: Seamless compatibility with Drupal's Layout Builder
- **CSS Grid System**: Modern CSS Grid-based responsive layouts
- **Region Management**: 25+ regions for maximum flexibility

### 🎛️ Superior Admin Experience
- **Theme Settings Panel**: Comprehensive settings interface with live preview
- **Visual Color Editor**: Material UI color picker with palette generation
- **Logo Management**: Support for SVG and raster logos with size constraints
- **Layout Selector**: Visual layout selector with real-time preview
- **Custom CSS Editor**: Built-in CSS editor with syntax highlighting and validation

### ♿ Accessibility First
- **WCAG 2.1 AA Compliant**: Full accessibility support with comprehensive testing
- **Screen Reader Support**: Semantic markup with appropriate ARIA attributes
- **Keyboard Navigation**: Complete keyboard accessibility throughout
- **High Contrast Mode**: Automatic detection and support for high contrast preferences
- **Reduced Motion**: Respects user motion preferences and provides static alternatives

## 🚀 Quick Start

### Installation

1. **Download the theme** to your Drupal installation:
   ```bash
   cd web/themes/custom/
   # Download or clone the theme here
   ```

2. **Install dependencies** (if developing):
   ```bash
   npm install
   ```

3. **Enable the theme**:
   ```bash
   drush cr
   drush theme:enable mui_base
   drush config:set system.theme default mui_base -y
   ```

4. **Configure the theme** at `/admin/appearance/settings/mui_base`

### Requirements

- **Drupal**: 10.x or 11.x
- **PHP**: 8.1 or higher
- **Browser Support**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## 🧩 Component Library

### Core UI Components
- **MUI Button**: Material UI styled buttons with variants (contained, outlined, text) and states
- **MUI Card**: Flexible card component with header, content, actions, and elevation variants
- **MUI Typography**: Complete typography system with semantic markup and responsive scaling
- **MUI Container**: Responsive container with configurable max-width constraints
- **MUI Paper**: Surface component with elevation shadows and outlined variants
- **MUI Chip**: Compact elements for tags, categories, and filters

### Navigation Components
- **MUI Mobile Menu**: Responsive mobile navigation with drawer, nested menus, and smooth animations
- **MUI Sidebar Menu**: Collapsible sidebar navigation with multi-level nesting and persistence
- **MUI App Bar**: Sticky header with navigation integration and scroll effects
- **MUI Breadcrumb**: Hierarchical navigation with structured data markup

### Form Components
- **MUI Input**: Styled form inputs with floating labels, validation states, and helper text
- **MUI Select**: Dropdown selects with Material UI styling and keyboard navigation
- **MUI Checkbox**: Checkbox inputs with ripple effects and indeterminate state
- **MUI Radio**: Radio button inputs with Material UI styling and grouping
- **MUI Switch**: Toggle switches with animation and accessibility features

### Data Display
- **MUI Table**: Responsive data tables with sorting, pagination, and selection
- **MUI List**: Flexible list component with avatars, icons, and actions
- **MUI Avatar**: User profile images with fallback initials and various sizes

## 📐 Layout System

### Available Layouts

| Layout | Description | Desktop | Tablet | Mobile |
|--------|-------------|---------|--------|--------|
| `1-col` | Single content column | 100% | 100% | 100% |
| `2-col-left` | Sidebar left, content right | 25% / 75% | 30% / 70% | Stacked |
| `2-col-right` | Content left, sidebar right | 75% / 25% | 70% / 30% | Stacked |
| `3-col-left` | Two sidebars left, content right | 20% / 20% / 60% | 50% / 50% | Stacked |
| `3-col-right` | Content left, two sidebars right | 60% / 20% / 20% | 50% / 50% | Stacked |
| `3-col-center` | Sidebar, content, sidebar | 20% / 60% / 20% | 100% | Stacked |
| `4-col` | Mixed width columns | 20% / 30% / 30% / 20% | 50% / 50% | Stacked |
| `4-col-equal` | Four equal width columns | 25% each | 50% each | Stacked |

### Responsive Behavior
- **Desktop (1200px+)**: Full layout as configured with all sidebars visible
- **Tablet (768px - 1199px)**: Simplified to maximum 2 columns, bottom sidebars move below content
- **Mobile (< 768px)**: Single column stack with mobile navigation drawer

## 🎨 Theming & Customization

### Color System
The theme implements Material UI's color system with automatic light/dark variants:

```css
/* Primary Colors */
--mui-primary-main: #1976d2;
--mui-primary-light: #42a5f5;
--mui-primary-dark: #1565c0;
--mui-primary-contrast-text: #ffffff;

/* Secondary Colors */
--mui-secondary-main: #dc004e;
--mui-secondary-light: #ff5983;
--mui-secondary-dark: #9a0036;

/* Status Colors */
--mui-error-main: #f44336;
--mui-warning-main: #ff9800;
--mui-info-main: #2196f3;
--mui-success-main: #4caf50;
```

### Typography Scale
```css
/* Material UI Typography Scale */
--mui-typography-h1: 6rem;    /* 96px */
--mui-typography-h2: 3.75rem; /* 60px */
--mui-typography-h3: 3rem;    /* 48px */
--mui-typography-h4: 2.125rem; /* 34px */
--mui-typography-h5: 1.5rem;  /* 24px */
--mui-typography-h6: 1.25rem; /* 20px */
--mui-typography-body1: 1rem; /* 16px */
--mui-typography-body2: 0.875rem; /* 14px */
```

### Spacing System
```css
/* 8px Grid System */
--mui-spacing-1: 8px;
--mui-spacing-2: 16px;
--mui-spacing-3: 24px;
--mui-spacing-4: 32px;
--mui-spacing-5: 40px;
```

## 🛠️ Development

### File Structure
```
mui_base/
├── components/              # Single Directory Components (SDC)
│   ├── mui-button/         # Button component with CSS/JS/Twig
│   ├── mui-card/           # Card component
│   ├── mui-mobile-menu/    # Mobile navigation
│   ├── mui-sidebar-menu/   # Sidebar navigation
│   ├── mui-typography/     # Typography component
│   └── mui-container/      # Container component
├── css/                    # Global stylesheets
│   ├── base.css           # Base styles and CSS reset
│   ├── layout.css         # Layout system and grid
│   ├── mui-theme.css      # Material UI design tokens
│   ├── mui-components.css # Component styles and Drupal overrides
│   └── admin.css          # Admin interface styles
├── js/                     # JavaScript functionality
│   ├── mui-base.js        # Core theme JavaScript
│   ├── mobile-menu.js     # Mobile navigation logic
│   ├── ripple-effects.js  # Material UI ripple effects
│   └── admin/             # Admin interface scripts
│       ├── color-picker.js # Color palette editor
│       └── layout-preview.js # Layout selector
├── templates/              # Twig template overrides
│   ├── layout/            # Layout templates
│   │   ├── page.html.twig
│   │   └── region.html.twig
│   ├── content/           # Content templates
│   │   ├── node.html.twig
│   │   └── field.html.twig
│   ├── navigation/        # Navigation templates
│   │   ├── menu.html.twig
│   │   └── breadcrumb.html.twig
│   └── form/              # Form templates
│       ├── form-element.html.twig
│       └── input.html.twig
├── config/                 # Configuration files
│   ├── install/           # Default configuration
│   └── schema/            # Configuration schema
├── images/                 # Theme images and assets
├── mui_base.info.yml      # Theme info file
├── mui_base.theme         # Theme hooks and preprocessing
├── mui_base.libraries.yml # Asset libraries definition
└── composer.json          # PHP dependencies
```

### CSS Architecture
The theme uses a modular CSS architecture:

1. **CSS Custom Properties**: All design tokens defined as CSS variables
2. **Component Isolation**: Each component has its own CSS file
3. **Mobile-First**: Responsive design starting from mobile breakpoints
4. **BEM Methodology**: Block, Element, Modifier naming convention
5. **Progressive Enhancement**: Graceful degradation for older browsers

### JavaScript API
```javascript
// Mobile menu control
const mobileMenu = Drupal.muiMobileMenu.getInstance(element);
mobileMenu.open();
mobileMenu.close();
mobileMenu.toggle();

// Sidebar menu control
const sidebarMenu = Drupal.muiSidebarMenu.getInstance(element);
sidebarMenu.expandAll();
sidebarMenu.collapseAll();
sidebarMenu.toggle(itemId);

// Ripple effects
Drupal.muiRipple.attach(button);

// Theme utilities
Drupal.muiBase.updateColorPalette(colors);
Drupal.muiBase.setDarkMode(enabled);
```

## 🔧 Configuration

### Theme Settings

#### Color Palette
- **Primary Color**: Main brand color with automatic light/dark variants
- **Secondary Color**: Accent color for highlights and CTAs
- **Custom Colors**: Error, warning, info, success state colors
- **Background Colors**: Default page and surface backgrounds

#### Typography
- **Font Family**: Choose from Roboto, system fonts, or custom font stack
- **Font Weights**: Configure available font weights (300, 400, 500, 700)
- **Font Loading**: Optimize font loading with swap strategy

#### Logo Configuration
- **Image Upload**: Support for PNG, JPG, GIF with size optimization
- **SVG Support**: Paste SVG markup for scalable vector logos
- **Sizing**: Set maximum width and height constraints
- **Alt Text**: Configure alternative text for accessibility

#### Layout Options
- **Default Layout**: Choose from 8 available layout configurations
- **Sidebar Behavior**: Configure sidebar collapse behavior
- **Responsive Breakpoints**: Customize breakpoint values
- **Container Width**: Set maximum content width

#### Advanced Settings
- **Dark Mode**: Enable automatic dark theme switching
- **Animations**: Toggle Material UI animations and transitions
- **Ripple Effects**: Enable/disable touch ripple feedback
- **Compact Mode**: Reduce spacing for information-dense layouts
- **High Contrast**: Enhanced contrast for accessibility
- **Custom CSS**: Add custom CSS with syntax highlighting

## 📋 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full Support |
| Firefox | 88+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 90+ | ✅ Full Support |
| iOS Safari | 14+ | ✅ Full Support |
| Android Chrome | 90+ | ✅ Full Support |

### Progressive Enhancement
- **Core Functionality**: Works without JavaScript
- **Enhanced Experience**: JavaScript adds interactions and animations
- **Graceful Degradation**: Fallbacks for older browsers
- **Performance**: Optimized for slow connections

## 🧪 Testing

### Accessibility Testing
- **WAVE**: Web Accessibility Evaluation Tool
- **axe-core**: Automated accessibility testing
- **Screen Readers**: JAWS, NVDA, VoiceOver compatibility
- **Keyboard Navigation**: Complete keyboard testing

### Browser Testing
- **Cross-Browser**: Tested across all supported browsers
- **Device Testing**: Real device testing on iOS and Android
- **Performance**: Lighthouse scores of 90+ across all metrics

### Quality Assurance
- **Code Standards**: Drupal coding standards compliance
- **Security**: Regular security audits and updates
- **Performance**: Optimized for Core Web Vitals

## 🤝 Contributing

### Development Setup
1. **Clone Repository**: `git clone [repository-url]`
2. **Install Dependencies**: `npm install && composer install`
3. **Development Server**: Use Drupal's development server
4. **Code Standards**: Follow Drupal coding standards
5. **Testing**: Run accessibility and cross-browser tests

### Contribution Guidelines
- **Issues**: Report bugs and feature requests on project page
- **Pull Requests**: Follow standard Git workflow
- **Documentation**: Update documentation for new features
- **Testing**: Include tests for new functionality

## 📄 License

This theme is licensed under the GNU General Public License v2.0 or later.
See LICENSE.txt for full license text.

## 🆘 Support

- **Documentation**: Comprehensive documentation on project page
- **Issue Queue**: Report bugs and request features
- **Community**: Drupal Slack #material-ui channel
- **Professional Support**: Available for custom implementations

## 📚 Resources

- [Material UI Documentation](https://mui.com/)
- [Drupal Theming Guide](https://www.drupal.org/docs/theming-drupal)
- [Single Directory Components](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Version**: 1.0.0  
**Drupal Compatibility**: 10.x, 11.x  
**Last Updated**: June 2025
