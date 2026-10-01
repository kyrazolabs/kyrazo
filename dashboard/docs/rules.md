# Kyrazo UI Design Rules

This document outlines the strict UI/UX standards for the Kyrazo client application. All new components and refactors must adhere to these rules to maintain a premium, consistent, and organized aesthetic.

## 1. Core Philosophy

- **Premium & Polished**: avoid "default" looks. Use subtle borders, refined shadows, and intentional spacing.
- **Dense & Information-Rich**: Avoid excessive whitespace. Use compact padding (`p-4`) to show more data without clutter.
- **Consistent Rounding**: A unified curvature (`rounded-xl`) across all interactive elements creates a cohesive feel.

## 2. Rounding Standards

**Strict Rule**: All interactive elements and containers must use `rounded-xl` (12px).

| Component   | Class / Style             | Notes                                        |
| :---------- | :------------------------ | :------------------------------------------- |
| **Buttons** | `rounded-xl`              | Applies to `<p-button>`, `<button>`.         |
| **Inputs**  | `rounded-xl`              | Text fields, select dropdowns, textareas.    |
| **Dialogs** | `rounded-xl`              | Modals and popups.                           |
| **Cards**   | `rounded-xl`              | Standard card containers.                    |
| **Tags**    | `rounded` or `rounded-md` | Small badges/chips can use tighter rounding. |

**Do Not Use**: `rounded-lg`, `rounded-2xl` on interactive elements.

## 3. Density & Spacing

**Strict Rule**: Use `p-4` for standard card padding.

- **Card Content**: Use `p-4` (Standard). Avoid `p-6` or `p-8` unless building a specific marketing-style landing page.
- **Grid Gaps**: Use `gap-4` or `gap-6` for main layouts.

## 4. Components

### Cards (`.card-panel`)

Always use the custom utility class `.card-panel` for content containers.

```html
<p-card styleClass="card-panel">
  <!-- content -->
</p-card>
<!-- OR -->
<div class="card-panel">
  <!-- content -->
</div>
```

- **Appearance**: White/Dark background, subtle border (`surface-200`/`surface-700`), `rounded-xl`.

### Buttons

Ensure buttons match the specific primary/secondary hierarchy.

```html
<p-button label="Primary" styleClass="rounded-xl!" />
<p-button
  label="Secondary"
  [outlined]="true"
  severity="secondary"
  styleClass="rounded-xl!"
/>
```

## 5. Colors & Theming

- **Backgrounds**:
  - Page: `bg-surface-50` (Light) / `bg-surface-950` (Dark).
  - Card: `bg-surface-0` (Light) / `bg-surface-900` (Dark) (handled by `.card-panel`).
- **Text**:
  - Heading: `text-surface-900` / `dark:text-surface-0`
  - Body: `text-surface-700` / `dark:text-surface-200`
  - Muted: `text-surface-500` / `dark:text-surface-400`

## 6. Anti-Patterns (What to Avoid)

- ❌ **Inconsistent Rounding**: Mixing `rounded-lg` inputs with `rounded-2xl` buttons.
- ❌ **Excessive Padding**: Using `p-8` for a simple form container.
- ❌ **Hardcoded Colors**: Using hex codes or `bg-gray-100`. Always use `surface-*` or `primary-*` variables.
- ❌ **Default Shadows**: Rely on the shadows defined in `.card-panel` or refined `shadow-sm`/`shadow-md`.
