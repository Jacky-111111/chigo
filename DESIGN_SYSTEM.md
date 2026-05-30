# ChiGo Visual Design System

This document defines ChiGo's visual direction for web and future mobile interfaces. All product stages should follow this document together with [TECH_STACK.md](./TECH_STACK.md).

## Design Goal

ChiGo should feel modern, social, and appetizing. The interface should make students want to find food now, but it should still feel practical enough for repeated daily use.

The product should not look like a generic delivery app, a dark crypto dashboard, or a playful food cartoon. It should feel like a clean campus dining utility with warm food energy.

## Required Brand Colors

Use these exact core colors:

| Token | Hex | Role |
| --- | --- | --- |
| `brand-eggplant` | `#372E7D` | Primary brand, navigation, high-emphasis text, active states |
| `brand-indigo` | `#6C6BE2` | Secondary actions, links, focus rings, selected filters |
| `food-saffron` | `#ECB22D` | Warm highlights, cuisine tags, rating accents, positive food cues |
| `food-tangerine` | `#DE7F24` | Primary food CTA accents, invite emphasis, warm surfaces |
| `food-chili` | `#E05C20` | Urgent action accents, expiring invites, strong highlights |

Neutral colors are allowed for readability and layout structure:

| Token | Hex | Role |
| --- | --- | --- |
| `surface` | `#FFFFFF` | Main app background and cards |
| `surface-soft` | `#F7F7FB` | Page bands, list backgrounds, subtle input areas |
| `border` | `#E5E4EF` | Borders and dividers |
| `text-main` | `#1F1D2B` | Default body text |
| `text-muted` | `#68647A` | Secondary text |

## Color Usage Rules

- Use `#372E7D` as the main brand anchor, but do not flood entire pages with dark purple.
- Use `#DE7F24`, `#ECB22D`, and `#E05C20` to make restaurant and invite moments feel warm and appetizing.
- Use `#6C6BE2` for interactive clarity: focus states, selected tabs, secondary buttons, and links.
- Prefer white and soft neutral surfaces for the majority of the UI.
- Avoid large purple-blue gradients. If gradients are used, keep them small and functional, such as a button hover or selected chip.
- Do not use `#ECB22D` as body text on white because it will not be readable enough.
- Do not use warm colors for every element. Food accents should guide attention, not turn the whole app orange.
- Destructive actions should not reuse the warm food CTA style. Use a clear danger treatment with text and confirmation.

Recommended color balance:

- 55-65% neutral surfaces.
- 15-20% `#372E7D`.
- 5-10% `#6C6BE2`.
- 10-15% warm food accents across `#ECB22D`, `#DE7F24`, and `#E05C20`.

## CSS Token Starting Point

Use CSS variables so Tailwind utilities and component styles stay consistent.

```css
:root {
  --brand-eggplant: #372e7d;
  --brand-indigo: #6c6be2;
  --food-saffron: #ecb22d;
  --food-tangerine: #de7f24;
  --food-chili: #e05c20;

  --surface: #ffffff;
  --surface-soft: #f7f7fb;
  --border: #e5e4ef;
  --text-main: #1f1d2b;
  --text-muted: #68647a;

  --radius-card: 8px;
  --radius-control: 8px;
  --shadow-soft: 0 10px 30px rgba(55, 46, 125, 0.10);
}
```

## Typography

- Use a modern sans-serif font stack.
- Prefer compact, readable app typography over oversized marketing text.
- Page titles should be clear and confident, not huge.
- Restaurant names and invite times should be the strongest text on cards.
- Avoid negative letter spacing.
- Do not scale font sizes with viewport width.

Suggested scale:

- Page title: 28-36px desktop, 24-28px mobile.
- Section title: 18-22px.
- Card title: 16-18px.
- Body text: 14-16px.
- Metadata: 12-13px.

## Layout Principles

- Build mobile-first because dining decisions often happen while walking or already outside.
- Keep the first screen useful: active invites, nearby restaurants, or a direct create-invite action.
- Use full-width app sections with constrained inner content.
- Cards are for repeated items such as restaurants, invites, people, and meal logs.
- Do not nest cards inside cards.
- Card border radius should be `8px` or less.
- Use stable dimensions for restaurant photos, invite cards, filters, and buttons to avoid layout shift.
- Keep restaurant and invite lists scannable; avoid decorative panels that reduce information density.

## App Navigation

Stage 1 web navigation should prioritize:

- Invites.
- Restaurants.
- Create invite.
- Settings.

Use `#372E7D` for active navigation and `#6C6BE2` for focus/hover states. Warm colors should be reserved for food and join/create actions, not every nav item.

## Components

### Primary Button

Use for the main action on a screen, such as `Create invite` or `Join`.

- Background: `#DE7F24`.
- Hover: darken slightly or add subtle shadow.
- Text: white.
- Focus ring: `#6C6BE2`.

### Secondary Button

Use for lower-emphasis actions.

- Border: `#DAD8EA` or `#6C6BE2`.
- Text: `#372E7D`.
- Background: white.

### Urgent Invite Button

Use when time-sensitive, such as an invite starting soon.

- Background: `#E05C20`.
- Text: white.
- Use sparingly.

### Restaurant Cards

Restaurant cards should make food feel present.

- Use a real food or restaurant image when available.
- Recommended image ratio: 4:3 or 16:10.
- Keep name, cuisine, distance, price, and primary action visible.
- Use `#ECB22D` for small cuisine/rating accents.
- Use `#DE7F24` for the create-invite action.

### Invite Cards

Invite cards should answer four questions quickly:

- Where?
- When?
- Who is hosting?
- Are there open spots?

Use `#372E7D` for the restaurant name or key heading, warm accents for open seats and starting-soon states, and neutral backgrounds for readability.

### Forms

- Inputs should be calm and readable.
- Border: `#E5E4EF`.
- Focus ring: `#6C6BE2`.
- Error text should be clear and not rely only on color.
- Multi-select preference chips can use soft `#6C6BE2` or warm food accent tints.

### Tags and Chips

- Cuisine tags: saffron or tangerine tint.
- Dietary tags: indigo tint.
- Warning tags: chili tint.
- Selected filters: `#372E7D` background with white text.

## Imagery

Food imagery matters for ChiGo.

- Prefer bright, natural, inspectable food photos.
- Avoid dark, blurred, heavily cropped, or generic stock-like images.
- Show the actual dish or restaurant context when possible.
- For seeded Stage 1 restaurants, images are optional, but the UI should reserve stable image space so photos can be added later.
- Do not use decorative food illustrations as a substitute for real restaurant or dish photos when users need to decide where to eat.

## Motion

- Motion should be fast and subtle.
- Good uses: button feedback, filter transitions, invite card arrival, loading skeleton shimmer.
- Avoid large page animations, bouncing effects, or motion that slows down the dining flow.

## Accessibility

- Body text should use `#1F1D2B` or `#372E7D` on light surfaces.
- Do not place `#ECB22D` text on white.
- Interactive elements need visible focus states.
- Do not rely on color alone for status; include text labels such as `Open`, `Full`, `Canceled`, or `Starting soon`.
- Buttons must have enough padding for mobile tapping.

## Stage 1 Visual Requirements

Stage 1 should visually emphasize:

- Nearby restaurant discovery.
- Immediate meal invites.
- Clear join/create actions.
- Trustworthy account and settings screens.

Stage 1 should not include:

- A marketing-style landing page as the primary app experience.
- Oversized hero sections that hide the actual invite or restaurant workflow.
- Decorative blobs, orbs, or abstract food backgrounds.
- A one-color purple interface.

## Implementation Checklist

- Define the CSS variables above in the global stylesheet.
- Map the brand tokens into Tailwind theme utilities when the app is scaffolded.
- Build reusable button, card, badge, input, tabs, and empty-state styles before expanding feature pages.
- Verify mobile and desktop screenshots before considering a page complete.
- Check that all text fits inside buttons, chips, cards, and nav items.
