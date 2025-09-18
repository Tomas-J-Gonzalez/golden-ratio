# Caterpillar Site Styling Boilerplate

A comprehensive reference for the visual styling, design system, and component patterns used in the Caterpillar sitemap generator project.

## 🎨 Design System

### Color Palette

```css
/* Brand Colors */
--color-brand-green: #314107;        /* Primary brand color */
--color-brand-green-light: #4a5f0a;  /* Hover states */
--color-brand-green-dark: #1f2a04;   /* Active states */

/* Slate Theme */
--color-slate-50: #f8fafc;   /* Background */
--color-slate-100: #f1f5f9;  /* Light backgrounds */
--color-slate-200: #e2e8f0;  /* Borders */
--color-slate-300: #cbd5e1;  /* Disabled states */
--color-slate-600: #475569;  /* Secondary text */
--color-slate-700: #334155;  /* Body text */
--color-slate-800: #1e293b;  /* Headings */
--color-slate-900: #0f172a;  /* Primary text */

/* Status Colors */
--color-red-50: #fef2f2;     /* Error backgrounds */
--color-red-200: #fecaca;    /* Error borders */
--color-red-500: #ef4444;    /* Error text */
--color-red-800: #991b1b;    /* Error dark text */
```

### Typography

```css
/* Font Stack */
font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-family: 'Geist Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;

/* Text Sizes */
text-xs: 0.75rem;      /* 12px - Small labels */
text-sm: 0.875rem;     /* 14px - Body text */
text-base: 1rem;       /* 16px - Default */
text-lg: 1.125rem;     /* 18px - Large body */
text-xl: 1.25rem;      /* 20px - Small headings */
text-2xl: 1.5rem;      /* 24px - Medium headings */
text-3xl: 1.875rem;    /* 30px - Large headings */
text-4xl: 2.25rem;     /* 36px - Page titles */
text-5xl: 3rem;        /* 48px - Logo/hero text */
```

## 🧩 Component Patterns

### Navigation Bar (Glassmorphism)

```tsx
<nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-sm">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 text-slate-900 font-semibold no-underline">
        <span className="text-2xl">🐛</span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <Link href="/" className="transition-colors no-underline text-slate-600 hover:text-[#314107]">
          Crawl
        </Link>
        <Link href="/debug" className="transition-colors no-underline text-slate-600 hover:text-[#314107]">
          Debug
        </Link>
        <Link href="/colophon" className="transition-colors no-underline text-slate-600 hover:text-[#314107] flex items-center gap-1">
          <Info className="w-4 h-4" />
          Colophon
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <Button variant="ghost" size="sm" className="md:hidden" aria-label="Toggle menu">
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>
    </div>
  </div>
</nav>
```

### Page Layout Structure

```tsx
<div className="min-h-screen bg-slate-50">
  <div className="container mx-auto px-4 py-8">
    {/* Header Section */}
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
        <span className="text-5xl">🐛</span>
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        Generate interactive sitemap visualisations from any website URL.
      </p>
    </div>

    {/* Main Content */}
    <div className="space-y-6">
      {/* Content sections */}
    </div>
  </div>
</div>
```

### Card Components

```tsx
{/* Standard Card */}
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <p className="text-sm text-slate-600">Optional description</p>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>

{/* Error Card */}
<Card className="border-red-200 bg-red-50">
  <CardContent className="p-4">
    <p className="text-red-800">Error message</p>
  </CardContent>
</Card>

{/* Stats Card */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span>Results</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-900">42</p>
        <p className="text-sm text-slate-600">Total Pages</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### Button Variants

```tsx
{/* Primary Button (Brand Green) */}
<Button className="bg-[#314107] hover:bg-[#4a5f0a] text-white">
  Generate Sitemap
</Button>

{/* Outline Button */}
<Button variant="outline" size="sm" className="flex items-center gap-2">
  <Download className="w-4 h-4" />
  Export JSON
</Button>

{/* Ghost Button */}
<Button variant="ghost" size="sm" aria-label="Toggle menu">
  <Menu className="w-5 h-5" />
</Button>

{/* Disabled Button */}
<Button disabled className="opacity-50 cursor-not-allowed">
  Processing...
</Button>
```

### Form Input Components

```tsx
{/* URL Input with Validation */}
<div className="space-y-4">
  <div className="relative">
    <Input
      type="url"
      placeholder="https://example.com"
      value={url}
      onChange={(e) => setUrl(e.target.value)}
      className={`pr-10 ${
        isValid === true
          ? 'border-[#314107] focus:border-[#314107] focus:ring-[#314107]'
          : isValid === false
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : ''
      }`}
      disabled={isLoading}
    />
    {hasInteracted && (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {isValid === true ? (
          <CheckCircle className="w-4 h-4 text-[#314107]" />
        ) : isValid === false ? (
          <XCircle className="w-4 h-4 text-red-500" />
        ) : null}
      </div>
    )}
  </div>

  {/* Validation Messages */}
  {isValid === true ? (
    <p className="text-[#314107] flex items-center gap-1">
      <CheckCircle className="w-3 h-3 flex-shrink-0" />
      <span className="hidden sm:inline">Valid URL - Ready to generate sitemap</span>
      <span className="sm:hidden">Valid URL - Ready</span>
    </p>
  ) : isValid === false ? (
    <p className="text-red-600 flex items-center gap-1">
      <XCircle className="w-3 h-3 flex-shrink-0" />
      <span className="hidden sm:inline">Invalid URL - Please enter a valid website address</span>
      <span className="sm:hidden">Invalid URL</span>
    </p>
  ) : null}
</div>
```

### Progress Components

```tsx
{/* Progress Steps */}
<div className="space-y-4">
  {progressSteps.map((step, index) => (
    <div key={step.id} className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
        index < currentStep ? 'bg-[#314107] text-white' :
        index === currentStep ? 'bg-[#314107]/20 text-[#314107] border-2 border-[#314107]' :
        'bg-slate-100 text-slate-500'
      }`}>
        {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${
          index <= currentStep ? 'text-slate-900' : 'text-slate-500'
        }`}>
          {step.title}
        </p>
        <p className="text-sm text-slate-600">{step.description}</p>
      </div>
    </div>
  ))}
</div>

{/* Progress Bar */}
<div className="w-full bg-slate-200 rounded-full h-2">
  <div 
    className="bg-[#314107] h-2 rounded-full transition-all duration-300 ease-out"
    style={{ width: `${progress}%` }}
  />
</div>
```

### Status Badges

```tsx
{/* Status Badge */}
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
  status === 'completed' ? 'bg-[#314107]/10 text-[#314107] border-[#314107]/20' :
  status === 'crawling' ? 'bg-[#314107]/10 text-[#314107] border-[#314107]/20' :
  status === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
  'bg-slate-100 text-slate-800 border-slate-200'
}`}>
  {status}
</span>
```

## 🎯 Interactive States

### Hover Effects

```css
/* Button Hover */
.hover\:bg-\[#4a5f0a\]:hover { background-color: #4a5f0a; }

/* Link Hover */
.hover\:text-\[#314107\]:hover { color: #314107; }

/* Card Hover */
.hover\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
```

### Focus States (Accessibility)

```css
/* Focus-visible for all interactive elements */
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
a:focus-visible,
[tabindex]:focus-visible {
  outline: dotted 2px var(--color-text);
  outline-offset: 3px;
}

/* Brand green focus for links */
a:focus-visible {
  outline: dotted 2px var(--color-brand-green);
  outline-offset: 2px;
}
```

### Cursor States

```css
/* Pointer cursor for buttons */
button,
[role="button"],
input[type="submit"],
input[type="button"] {
  cursor: pointer;
}

/* Not-allowed cursor for disabled elements */
button:disabled,
[role="button"]:disabled,
input:disabled {
  cursor: not-allowed;
}
```

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Responsive Patterns

```tsx
{/* Responsive Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

{/* Responsive Text */}
<p className="text-sm md:text-base lg:text-lg">
  Responsive text sizing
</p>

{/* Responsive Spacing */}
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>

{/* Responsive Visibility */}
<div className="hidden md:block">
  Desktop only content
</div>
<div className="md:hidden">
  Mobile only content
</div>
```

## 🎨 Visual Effects

### Glassmorphism

```css
/* Navigation glassmorphism */
backdrop-blur-md bg-white/80 border-b border-white/20 shadow-sm
```

### Gradients

```css
/* Brand green gradient */
bg-gradient-to-br from-[#314107]/5 to-[#314107]/10
```

### Shadows

```css
/* Card shadows */
shadow-sm    /* Small shadow */
shadow-md    /* Medium shadow */
shadow-lg    /* Large shadow */
```

## 🔧 Utility Classes

### Spacing

```css
/* Padding */
p-4, p-6, p-8    /* All sides */
px-4, py-6       /* Horizontal/Vertical */
pt-4, pb-6       /* Top/Bottom */
pl-4, pr-6       /* Left/Right */

/* Margin */
m-4, m-6, m-8    /* All sides */
mx-auto          /* Center horizontally */
my-4, my-6       /* Vertical margin */
```

### Flexbox

```css
/* Flex containers */
flex items-center justify-between
flex items-center gap-2
flex flex-col gap-4
flex-1            /* Grow to fill space */
```

### Grid

```css
/* Grid layouts */
grid grid-cols-2 md:grid-cols-4 gap-4
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

## 📝 Content Patterns

### Text Hierarchy

```tsx
{/* Page Title */}
<h1 className="text-4xl font-bold text-slate-900 mb-4">
  Page Title
</h1>

{/* Section Headings */}
<h2 className="text-2xl font-semibold text-slate-800 mb-3">
  Section Heading
</h2>

{/* Card Titles */}
<h3 className="text-lg font-medium text-slate-900">
  Card Title
</h3>

{/* Body Text */}
<p className="text-slate-600">
  Regular body text
</p>

{/* Small Text */}
<p className="text-sm text-slate-500">
  Small descriptive text
</p>
```

### Link Styling

```css
/* Global link styles */
a {
  color: var(--color-brand-green);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}

a:hover {
  color: var(--color-brand-green-light);
  text-decoration-thickness: 2px;
}
```

## 🚀 Implementation Notes

### CSS Variables Setup

```css
@layer base {
  :root {
    --color-brand-green: #314107;
    --color-brand-green-light: #4a5f0a;
    --color-brand-green-dark: #1f2a04;
  }
}
```

### Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-green': '#314107',
        'brand-green-light': '#4a5f0a',
        'brand-green-dark': '#1f2a04',
      }
    }
  }
}
```

### Component Library

This styling system works with:
- **shadcn/ui** components
- **Tailwind CSS** for utility classes
- **Lucide React** for icons
- **Next.js** for routing and layout

---

*This boilerplate provides a complete reference for recreating the Caterpillar site's visual design system in other projects. All patterns are production-tested and accessibility-compliant.*
