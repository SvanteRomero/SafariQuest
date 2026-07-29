---
name: Savanna Heritage
colors:
  surface: '#faf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#faf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ef'
  surface-container: '#efeee9'
  surface-container-high: '#e9e8e3'
  surface-container-highest: '#e3e3de'
  on-surface: '#1b1c19'
  on-surface-variant: '#3f4a3e'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#6f7a6d'
  outline-variant: '#becaba'
  surface-tint: '#006e2a'
  primary: '#006b29'
  on-primary: '#ffffff'
  primary-container: '#118738'
  on-primary-container: '#f7fff2'
  inverse-primary: '#73dc82'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#ad2a27'
  on-tertiary: '#ffffff'
  tertiary-container: '#cf433c'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8ffa9b'
  primary-fixed-dim: '#73dc82'
  on-primary-fixed: '#002108'
  on-primary-fixed-variant: '#00531e'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ac'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#8e1214'
  background: '#faf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e3e3de'
  savanna-green: '#1E8E3E'
  golden-sun: '#F59E0B'
  terracotta: '#B45309'
  sand-stone: '#E5E7EB'
  ivory-base: '#FDFCF7'
  deep-earth: '#2D2D2D'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

The design system is crafted to evoke the raw beauty and professional reliability of a premium Tanzanian safari experience. The brand personality is **Authentic, Breathtaking, and Trustworthy**, bridging the gap between rugged adventure and high-end hospitality. 

The visual style is a sophisticated blend of **Minimalism** and **Tactile** design. It prioritizes expansive whitespace and full-width cinematic photography to let the natural wonders of Africa take center stage. This is balanced with refined, organic UI elements—subtle curves and natural textures—that feel grounded in the earth. The emotional response should be one of awe-inspired calm, assuring the traveler that they are in expert hands for their journey of a lifetime.

## Colors

This design system utilizes an earthy, high-contrast palette inspired by the Serengeti landscape. 

- **Primary (Savanna Green):** A deep, lush green derived from the reference material, used for primary actions and brand presence.
- **Secondary (Golden Sun):** A rich gold that represents the African horizon, used for highlights and trust elements like star ratings.
- **Tertiary (Terracotta):** A warm, clay-inspired red for accents that require warmth and heritage.
- **Neutral (Ivory & Deep Earth):** Instead of pure white/black, we use a warm Ivory (`#FDFCF7`) for backgrounds to reduce eye strain and a Deep Earth (`#2D2D2D`) for text to maintain a soft, natural readability.

The default color mode is **light**, utilizing the warm ivory as the primary surface color to create an inviting, open atmosphere.

## Typography

The typography strategy balances heritage with modernity. 

**Source Serif 4** is used for headlines to convey a sense of editorial authority and timeless adventure. Its sturdy serifs feel like classic travel journals. 

**Manrope** provides a clean, modern contrast for body copy. Its high legibility and contemporary geometric structure ensure that logistical details (itineraries, pricing, and specs) are clear and professional. 

For mobile screens, display sizes are scaled down aggressively to ensure large titles do not break layouts, while maintaining the characteristic high-contrast weight of the serif headers.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a generous "breathable" rhythm. We use a 12-column grid for desktop with wide 24px gutters to prevent content density.

- **Whitespace:** High margins (64px+) are used between sections to create a sense of luxury and calm.
- **Full-Width Bleeds:** Photography should frequently break the grid, bleeding to the edges of the viewport to immerse the user in the safari experience.
- **Mobile Reflow:** On mobile, the 12-column grid collapses to a single column with 20px side margins. Section gaps are reduced to 80px to maintain momentum while scrolling.

## Elevation & Depth

To maintain an organic and natural feel, this design system avoids heavy shadows. Depth is achieved through **Tonal Layers** and **Subtle Micro-Shadows**:

- **Surface Tiers:** Use subtle variations of the neutral palette (Ivory to Sand) to separate content sections without relying on borders.
- **Depth:** Cards and CTA buttons use "Ambient Shadows"—extremely low-opacity (4-8%) blurs with a slight warm tint (#2D2D2D) to make them appear softly lifted from the ivory surface.
- **Glassmorphism:** Navigation bars use a light backdrop blur (12px) with 80% opacity ivory to keep the focus on the photography beneath as the user scrolls.

## Shapes

The shape language is **Rounded (Level 2)**. This approach softens the UI, making it feel more approachable and organic, echoing the soft curves of the landscape. 

- **Cards & Inputs:** 0.5rem (8px) radius.
- **Large Imagery:** 1rem (16px) radius when not full-bleed.
- **Interactive Elements:** Buttons and tags use the standard 0.5rem radius, providing a consistent "friendly-professional" tactile feel.

## Components

### Buttons
Primary CTAs are solid **Savanna Green** with ivory text. Secondary buttons use a **Terracotta** outline or a ghost style with an icon. Interaction states should be subtle—a slight darkening of the background color on hover.

### Safari Package Cards
Cards feature a high-aspect-ratio image at the top (rounded-lg), followed by a clear title in Source Serif 4. A "Trust Bar" is included at the bottom of the card, showing the **Golden Sun** star rating and "Certified Guide" badges.

### Accordions (FAQs)
Used for trip logistics. These should be minimalist with a simple chevron icon. The active state should use a very pale Sand background to highlight the expanded content.

### Input Fields
Inputs use a solid Ivory background with a subtle 1px Sand border. On focus, the border transitions to Savanna Green.

### Trust Elements
Badges and star ratings are essential. Stars are always **Golden Sun**. Badges (e.g., "Park Authorized") should use the **Savanna Green** as a stamp-style icon to ensure authenticity.

### Scroll Animations
Use subtle "fade-in-up" animations for cards and text blocks as they enter the viewport to create a premium, orchestrated feel.