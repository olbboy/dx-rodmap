# Design Implementation - Sprint 2: Roadmap Management

## Overview

This document outlines the design implementation details for Sprint 2 of the Roadmap Application, focusing on roadmap management functionality. The implementation follows the design system established in Sprint 1 and extends it with new components and patterns specific to roadmap management.

## UI Components

### Roadmap List

The roadmap list component displays a grid of roadmap cards, each showing key information about a roadmap:

```tsx
// components/roadmap/roadmap-list.tsx
export function RoadmapList({ roadmaps }: RoadmapListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {roadmaps.map((roadmap) => (
        <Card key={roadmap.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium">
                <Link
                  href={`/roadmaps/${roadmap.id}`}
                  className="hover:underline"
                >
                  {roadmap.title}
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {roadmap.description || "No description"}
              </CardDescription>
            </div>
            <DropdownMenu>
              {/* Actions dropdown */}
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1">
            {/* Metadata */}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            {/* Updated timestamp */}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

### Roadmap Form

The roadmap form component provides a consistent interface for both creating and editing roadmaps:

```tsx
// components/roadmap/roadmap-form.tsx
export function RoadmapForm({ roadmap }: RoadmapFormProps) {
  // State and handlers
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="My Project Roadmap"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe the purpose of this roadmap..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="is_public"
            checked={formData.is_public}
            onCheckedChange={handleSwitchChange}
            disabled={isLoading}
          />
          <Label htmlFor="is_public">Make this roadmap public</Label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        {/* Action buttons */}
      </div>
    </form>
  );
}
```

### Roadmap Detail

The roadmap detail view displays comprehensive information about a roadmap:

```tsx
// app/roadmaps/[id]/page.tsx
export default async function RoadmapPage({ params }: RoadmapPageProps) {
  // Fetch data and check permissions
  
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{roadmap.title}</h1>
            {roadmap.is_public && (
              <Badge variant="outline">Public</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {roadmap.description || "No description provided"}
          </p>
        </div>
        {isOwner && (
          <Button asChild className="mt-4 md:mt-0">
            <Link href={`/roadmaps/${params.id}/edit`}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit Roadmap
            </Link>
          </Button>
        )}
      </div>
      
      {/* Metadata and features section */}
    </div>
  );
}
```

## New UI Components

### Card Component

The Card component is used for displaying roadmaps in a consistent format:

```tsx
// components/ui/card.tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// Additional card subcomponents: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
```

### Dropdown Menu

The Dropdown Menu component provides a consistent way to display actions for roadmaps:

```tsx
// components/ui/dropdown-menu.tsx
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
// Additional dropdown subcomponents

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
```

### Badge Component

The Badge component is used to indicate status (e.g., public/private):

```tsx
// components/ui/badge.tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Additional variants
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
```

### Switch Component

The Switch component is used for toggling boolean values (e.g., public/private):

```tsx
// components/ui/switch.tsx
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
```

### Textarea Component

The Textarea component is used for multi-line text input (e.g., roadmap descriptions):

```tsx
// components/ui/textarea.tsx
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

## Page Layouts

### Dashboard Layout

The dashboard layout displays a list of the user's roadmaps and provides a way to create new ones:

```tsx
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // Fetch data
  
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}
          </p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/roadmaps/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Roadmap
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Your Roadmaps</h2>
          {roadmaps && roadmaps.length > 0 ? (
            <RoadmapList roadmaps={roadmaps} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
```

### Create Roadmap Layout

The create roadmap layout provides a form for creating new roadmaps:

```tsx
// app/roadmaps/new/page.tsx
export default function NewRoadmapPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Create Roadmap</h1>
        <p className="text-muted-foreground">
          Create a new roadmap to plan and track your project features and goals.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <RoadmapForm />
        </div>
      </div>
    </div>
  );
}
```

### Edit Roadmap Layout

The edit roadmap layout provides a form for editing existing roadmaps:

```tsx
// app/roadmaps/[id]/edit/page.tsx
export default async function EditRoadmapPage({ params }: EditRoadmapPageProps) {
  // Fetch data and check permissions
  
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Edit Roadmap</h1>
        <p className="text-muted-foreground">
          Update your roadmap details and settings.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <RoadmapForm roadmap={roadmap} />
        </div>
      </div>
    </div>
  );
}
```

## Responsive Design

All components and layouts are designed to be responsive, with specific adjustments for different screen sizes:

1. **Mobile-First Approach**: Base styles are designed for mobile, with media queries for larger screens.
2. **Flexible Layouts**: Grid and flex layouts adapt to different screen sizes.
3. **Responsive Typography**: Font sizes and spacing adjust based on screen size.
4. **Conditional Rendering**: Some UI elements are conditionally rendered based on screen size.

Example of responsive design in the roadmap list:

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Roadmap cards */}
</div>
```

## Accessibility Considerations

1. **Keyboard Navigation**: All interactive elements are keyboard accessible.
2. **Screen Reader Support**: Proper ARIA attributes and semantic HTML.
3. **Focus Management**: Visible focus indicators for keyboard users.
4. **Color Contrast**: Sufficient contrast ratios for text and UI elements.
5. **Form Labels**: All form inputs have associated labels.

Example of accessibility features in the dropdown menu:

```tsx
<Button variant="ghost" size="icon" className="h-8 w-8">
  <MoreHorizontal className="h-4 w-4" />
  <span className="sr-only">Open menu</span>
</Button>
```

## Animation and Transitions

Subtle animations and transitions are used to enhance the user experience:

1. **Hover Effects**: Interactive elements have hover states.
2. **Focus Transitions**: Smooth transitions for focus states.
3. **Loading States**: Animated loading indicators.
4. **Dropdown Animations**: Smooth animations for opening/closing dropdowns.

Example of animation in the dropdown menu:

```tsx
"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
```

## Conclusion

The design implementation for Sprint 2 builds upon the foundation established in Sprint 1, introducing new components and patterns specific to roadmap management. The implementation follows the design system guidelines, ensuring consistency, accessibility, and responsiveness across the application.

The next sprint will extend this design system with components for post management, allowing users to create and manage features and goals within their roadmaps. 