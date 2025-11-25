# Design System Documentation

This project uses a modern, production-ready design stack combining **shadcn/ui**, **Motion (Framer Motion)**, and a custom **Coolors palette**.

## 🎨 Stack Overview

### 1. shadcn/ui Components
- **Style**: New York
- **Theme**: CSS Variables enabled
- **Base Color**: Slate
- **Components Available**: Button, Card, Input, Select, Dialog, Badge, Avatar, Form, Label, Dropdown Menu, Tabs

### 2. Motion (Framer Motion)
- **Package**: `motion` and `framer-motion`
- **Location**: `@/components/motion/motion-wrapper.tsx`
- **Features**: Fade-in, scale, slide, stagger animations

### 3. Color Palette
- **Source**: Coolors.co
- **Location**: `@/lib/colors.ts`
- **Format**: HSL CSS variables
- **Colors**: Primary (Indigo), Secondary (Purple), Accent (Pink), Success, Warning, Destructive

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── form.tsx
│   │   │   ├── label.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── tabs.tsx
│   │   ├── motion/          # Motion wrapper components
│   │   │   └── motion-wrapper.tsx
│   │   └── DesignShowcase.tsx  # Complete demo component
│   ├── lib/
│   │   ├── utils.js         # cn() utility
│   │   └── colors.ts        # Color palette configuration
│   └── index.css            # Global styles & CSS variables
├── components.json          # shadcn/ui config
└── tailwind.config.js       # Tailwind configuration
```

## 🚀 Quick Start

### Using shadcn/ui Components

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

### Using Motion Animations

```tsx
import { MotionWrapper, InteractiveMotion } from '@/components/motion/motion-wrapper';

function AnimatedComponent() {
  return (
    <MotionWrapper variant="fadeIn">
      <h1>This fades in on mount</h1>
    </MotionWrapper>

    <InteractiveMotion>
      <Button>This scales on hover/tap</Button>
    </InteractiveMotion>
  );
}
```

### Available Motion Variants

- **fadeIn**: Fade and slide up (default)
- **scaleIn**: Scale from 0.9 to 1 with spring
- **slideInFromLeft**: Horizontal slide from left
- **slideInFromRight**: Horizontal slide from right
- **staggerContainer**: Container for staggered children

### Stagger Animation for Lists

```tsx
import { StaggerContainer, StaggerItem } from '@/components/motion/motion-wrapper';

function List() {
  return (
    <StaggerContainer>
      {items.map((item) => (
        <StaggerItem key={item.id}>
          <Card>{item.content}</Card>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
```

## 🎨 Using Colors

### In Tailwind Classes

```tsx
// Background colors
<div className="bg-primary text-primary-foreground">Primary</div>
<div className="bg-secondary text-secondary-foreground">Secondary</div>
<div className="bg-accent text-accent-foreground">Accent</div>
<div className="bg-success text-success-foreground">Success</div>
<div className="bg-warning text-warning-foreground">Warning</div>
<div className="bg-destructive text-destructive-foreground">Error</div>

// Border colors
<div className="border border-primary">Primary border</div>

// Text colors
<p className="text-primary">Primary text</p>
```

### In CSS/SCSS

```css
.my-element {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

### Updating the Color Palette

1. Go to [Coolors.co](https://coolors.co/) and create your palette
2. Open `src/lib/colors.ts`
3. Update the hex values in the `colorPalette` object
4. The CSS variables in `src/index.css` will automatically use the new colors

## 📦 Adding New shadcn/ui Components

To add more components from shadcn/ui:

```bash
cd frontend
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add tooltip
npx shadcn@latest add popover
npx shadcn@latest add sheet
```

## 🎯 Best Practices

### Component Composition

```tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InteractiveMotion, MotionWrapper } from '@/components/motion/motion-wrapper';

export function FeatureCard({ title, description }) {
  return (
    <MotionWrapper variant="fadeIn">
      <InteractiveMotion>
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">{description}</p>
          <Button variant="default">Learn More</Button>
        </Card>
      </InteractiveMotion>
    </MotionWrapper>
  );
}
```

### Responsive Design

```tsx
<Card className="p-4 md:p-6 lg:p-8">
  <h2 className="text-2xl md:text-3xl lg:text-4xl">Responsive Heading</h2>
</Card>
```

### Dark Mode Support

All colors automatically support dark mode via the `.dark` class on the root element. The theme switches based on CSS variables defined in `index.css`.

## 🔧 Configuration Files

### `components.json`
```json
{
  "style": "new-york",
  "tsx": true,
  "tailwind": {
    "cssVariables": true
  }
}
```

### `tailwind.config.js`
Extends Tailwind with shadcn colors and custom success/warning states.

### `vite.config.js`
Configured with `@` path alias for clean imports.

## 📚 Reference

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Coolors Palette Generator](https://coolors.co/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🎪 Demo Component

Check out `src/components/DesignShowcase.tsx` for a complete demonstration of all features working together. This component shows:

- Color palette display
- Interactive buttons with motion
- Stagger animations
- Form components
- Card layouts
- Badge usage
- Code references

To view the showcase, import and render the component in your app:

```tsx
import DesignShowcase from '@/components/DesignShowcase';

function App() {
  return <DesignShowcase />;
}
```

## 💡 Tips

1. **Use InteractiveMotion** for buttons and clickable cards to add polish
2. **Use StaggerContainer** for lists and grids to create smooth entry animations
3. **Combine variants** with delay props for choreographed animations
4. **Keep it subtle** - animations should enhance, not distract
5. **Test dark mode** - all colors have dark mode variants

## 🚨 Common Issues

### Issue: Motion animations not working
**Solution**: Make sure you've imported from the correct path:
```tsx
import { MotionWrapper } from '@/components/motion/motion-wrapper';
```

### Issue: Colors not applying
**Solution**: Check that CSS variables are properly defined in `src/index.css`

### Issue: Component imports failing
**Solution**: Verify the `@` alias is configured in `vite.config.js`:
```js
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  }
}
```
