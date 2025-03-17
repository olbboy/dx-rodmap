# Design System Documentation

## Overview

This design system is built on Next.js 15.2.2 using the App Router, React 19, Shadcn UI, Radix UI primitives, and Tailwind CSS v4. It provides a consistent, accessible, and customizable foundation for building modern web applications.

## Design Tokens

### Colors

The design system uses a comprehensive color palette with both light and dark modes:

#### Base Colors (Light Mode)
- **Background**: `hsl(210 30% 99%)`
- **Foreground**: `hsl(222 47% 11%)`
- **Muted**: `hsl(210 25% 94%)`
- **Muted Foreground**: `hsl(215 25% 35%)`
- **Border**: `hsl(214 20% 90%)`
- **Input**: `hsl(214 20% 90%)`

#### Primary Colors
- **Primary**: `hsl(222 83% 55%)` - Professional blue
- **Primary Foreground**: `hsl(210 40% 98%)`

#### Secondary Colors
- **Secondary**: `hsl(250 75% 60%)` - Deep purple
- **Secondary Foreground**: `hsl(210 40% 98%)`

#### Accent Colors
- **Accent**: `hsl(174 75% 42%)` - Vibrant teal
- **Accent Foreground**: `hsl(210 40% 98%)`

#### Semantic Colors
- **Destructive**: `hsl(0 84% 60%)` - Error red
- **Destructive Foreground**: `hsl(210 40% 98%)`
- **Success**: `hsl(142 72% 42%)` - Success green
- **Success Foreground**: `hsl(210 40% 98%)`
- **Warning**: `hsl(38 92% 50%)` - Warning amber
- **Warning Foreground**: `hsl(210 40% 98%)`

#### Sidebar Colors
- **Sidebar Background**: `hsl(222 47% 11%)`
- **Sidebar Foreground**: `hsl(210 30% 90%)`
- **Sidebar Primary**: `hsl(222 83% 55%)`
- **Sidebar Primary Foreground**: `hsl(210 40% 98%)`
- **Sidebar Accent**: `hsl(174 75% 42%)`
- **Sidebar Accent Foreground**: `hsl(210 40% 98%)`
- **Sidebar Border**: `hsl(223 35% 16%)`

#### Chart Colors
- **Chart 1**: `hsl(222 83% 55%)`
- **Chart 2**: `hsl(250 75% 60%)`
- **Chart 3**: `hsl(174 75% 42%)`
- **Chart 4**: `hsl(38 92% 50%)`
- **Chart 5**: `hsl(326 80% 56%)`

### Typography

The design system uses a hierarchical typography system with consistent sizing and weights:

- **Heading (h1-h6)**: Uses the base font with different size scales
- **Body**: Default text style for paragraphs and general content
- **Small**: Smaller text for captions, footnotes, and supplementary information
- **Muted**: Reduced emphasis text, typically in a muted color

### Spacing

The spacing system follows Tailwind's spacing scale, with customizations for consistency:

- Consistent spacing tokens (4px increments)
- Container padding standardized at 2rem (32px)
- Max container width of 1400px for larger screens

### Borders & Radius

- **Border Color**: Default is `var(--border)`
- **Border Radius**:
  - **Large**: `var(--radius)` (0.6rem)
  - **Medium**: `calc(var(--radius) - 2px)` (0.4rem)
  - **Small**: `calc(var(--radius) - 4px)` (0.2rem)

### Shadows

Multiple shadow variants for different elevation levels:

- **Small**: `var(--shadow-sm)` - Subtle elevation for cards and subtle UI elements
- **Medium**: `var(--shadow-md)` - Medium elevation for popovers and dropdowns
- **Large**: `var(--shadow-lg)` - Higher elevation for modals and dialogs
- **Extra Large**: `var(--shadow-xl)` - Highest elevation for important UI elements

## Components

The design system includes a comprehensive set of components built with Shadcn UI and Radix UI primitives:

### Layout Components
- **Card**: Container with padding, borders, and optional shadows
- **Layout**: Page layout components with sidebar and main content areas
- **Sidebar**: Navigation sidebar with customizable colors and styles

### Navigation Components
- **Breadcrumb**: Shows the current page location within a hierarchy
- **Navigation**: Main navigation components including nav-main, nav-projects, nav-user
- **Tabs**: Organizes content into separate views within the same context

### Input Components
- **Button**: Multiple variants including primary, secondary, outline, ghost, link, destructive
- **Checkbox**: Toggle for boolean inputs
- **Input**: Text input fields with various states
- **Radio Group**: Selection from a set of predefined options
- **Select**: Dropdown selection component
- **Slider**: Range selection component
- **Switch**: Toggle component for binary choices
- **Textarea**: Multi-line text input

### Display Components
- **Avatar**: User profile pictures with fallback initials
- **Badge**: Small status indicators
- **Progress**: Visual indicator of completion or process
- **Separator**: Horizontal or vertical divider
- **Skeleton**: Loading placeholders
- **Table**: Data display in rows and columns

### Feedback Components
- **Alert**: Contextual feedback messages
- **Alert Dialog**: Modal dialog for important alerts requiring confirmation
- **Dialog**: Modal window for focused tasks or inputs
- **Popover**: Contextual floating content
- **Tooltip**: Simple informational overlay
- **Toast/Sonner**: Notification system

### Advanced Components
- **Accordion**: Expandable/collapsible content sections
- **Calendar**: Date selection component
- **Command**: Command palette for keyboard navigation
- **Dropdown Menu**: Context menu with various options
- **Form**: Form components with validation
- **Modal**: Modal overlay components
- **Scroll Area**: Customized scrollable containers
- **Sheet**: Slide-in panel from screen edge

## Customized Components

The design system includes several customized components that extend the base components to provide specific functionality for the application:

### Dashboard Components

#### PostCard
A comprehensive card component designed specifically for displaying post items with:
- Status badges with customized color schemes
- Progress indicators
- Tag display
- Due date visualization
- Edit and delete actions with confirmation
- Animation support via Framer Motion
- Compact and full view modes
- Drag and drop capability

#### FilterBar
A specialized filtering component for dashboard views that provides:
- Search functionality with expandable input
- Status filtering with multi-select
- Tag filtering based on available post tags
- Date range filtering with calendar integration
- Priority filtering
- Responsive design with mobile optimization
- Visual feedback for active filters

#### SortBar
A sorting control component with:
- Field selection (title, status, date, priority, progress)
- Direction toggling (ascending/descending)
- Visual indicators for active sort
- Dropdown menu for sort field selection

### Navigation and Command Components

#### KBar Command Palette
A keyboard-accessible command palette providing:
- Global navigation shortcuts
- Theme switching commands
- Search functionality
- Custom result rendering
- Section organization for different command types
- Keyboard shortcuts display

#### AppSidebar
An enhanced sidebar component with:
- Collapsible navigation sections
- User profile integration
- Notification access
- Responsive design with mobile adaptation
- Visual hierarchy for navigation items
- Multi-level navigation support
- Integration with theme system

### Utility Components

#### FileUploader
A comprehensive file upload component with:
- Drag and drop zone
- Multiple file support
- Progress tracking for uploads
- File type validation
- Size restrictions
- Preview capability for images
- Accessible interface
- Error handling and user feedback

#### TeamSwitcher
A component for switching between teams/organizations with:
- Dropdown interface
- Current selection display
- Creation workflow integration
- Visual feedback for active team

#### ModeToggle
A theme mode toggle component that:
- Switches between light, dark, and system preferences
- Provides visual feedback for current mode
- Integrates with the system-wide theme provider

#### AlertModal
A specialized modal for confirmation actions with:
- Danger styling for destructive actions
- Cancel and confirm buttons
- Loading state visualization
- Accessibility considerations

#### FormCardSkeleton
A loading placeholder specifically designed for form cards with:
- Visual representation of form layout while loading
- Animated shimmer effect
- Responsive adaptation to container size

### Layout Components

#### PageContainer
A standardized container for page content that:
- Maintains consistent padding
- Enforces maximum width constraints
- Adapts to different screen sizes
- Provides consistent spacing

#### Header
A consistent application header with:
- Navigation integration
- User controls
- Responsive adaptation
- Theme integration

#### UserNav
A dedicated navigation component for user-related actions:
- Profile access
- Account settings
- Notification center
- Session management (logout)

### Theme Components

#### ThemeCustomizer
An advanced theme customization interface that allows:
- Color palette customization with HSL controls
- Theme saving and management
- Component-specific theme adjustments
- Real-time preview of changes
- Preset theme selection

#### ThemeProvider
A context provider for consistent theme application throughout the application:
- Dark/light mode switching
- Custom theme application
- System preference detection
- Persistence of user preferences

## Animation System

The design system includes several animation utilities:

- **Accordion Animations**: Smooth expand/collapse for accordion components
- **Rainbow Effect**: Color shifting gradient animation
- **Pulse**: Subtle opacity animation for loading indicators
- **Bounce**: Vertical movement animation for attention-grabbing elements
- **Shimmer**: Loading state animation that moves across elements
- **Glow**: Subtle highlight effect for buttons and important elements

## Theme Customization

The design system includes a theme customizer that allows for:

- Adjusting color palettes with HSL color pickers
- Saving and applying custom themes
- Switching between light and dark modes
- Component-specific style adjustments
- Real-time preview of theme changes

## Utility Functions

Several utility functions are available:

- **cn()**: Combines class names with Tailwind's merge utility
- **formatBytes()**: Format byte values into readable file sizes
- Various data handling utilities for filtering, sorting, and managing content

## Responsive Design

The design system implements responsive design with:

- Mobile-first approach using Tailwind breakpoints
- Container queries for component-specific responsiveness
- Dynamic viewport height handling (using dvh units)
- Consistent spacing across device sizes

## Accessibility

The design system prioritizes accessibility through:

- Semantic HTML structure
- ARIA attributes on interactive components
- Keyboard navigation support
- Sufficient color contrast in both light and dark modes
- Focus management for modals and dialogs

## Usage Guidelines

When implementing this design system:

1. Use server components by default, only adding 'use client' when necessary
2. Follow the component hierarchy and composition patterns
3. Maintain consistent spacing and typography
4. Leverage the theming system for customizations
5. Follow the accessibility patterns implemented in the components 