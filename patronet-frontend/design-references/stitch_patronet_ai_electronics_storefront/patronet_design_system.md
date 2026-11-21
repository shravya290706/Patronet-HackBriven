---
name: "PATRONET Cinematic Retail"
description: "High-contrast black, white, and vivid orange design system for PATRONET, an AI-powered electronics e-commerce platform."
---

## Overview

PATRONET is a premium, futuristic electronics e-commerce platform in India built around cinematic product presentation and conversational AI discovery. The visual language pairs high-contrast obsidian black (`#111111`) hero stages with crisp gallery white (`#FFFFFF`) and neutral light gray (`#F5F5F5`) shopping surfaces, punctuated by disciplined, high-energy `#FF6B00` orange accents. Typography is tight, geometric, and utilitarian using Inter with tabular numerals for Indian Rupee pricing.

## Colors

The palette preserves PATRONET's exact brand identity: vivid `#FF6B00` orange for primary CTAs, hardware lighting accents, and active states; `#111111` deep black for cinematic hero stages and primary ink; `#FFFFFF` pure white for navigation and product cards; `#F5F5F5` light gray for studio product backdrops and bento tiles; and `#6B6B6B` muted gray for secondary metadata. For small orange text on white surfaces, `accent-orange-text` (`#C85300`) guarantees WCAG AA contrast while preserving the warm orange hue.

```yaml
colors:
  primary-orange: "#FF6B00"
  on-primary-orange: "#111111"
  primary-orange-hover: "#E05E00"
  primary-orange-tint: "#FFEDE6"
  accent-orange-text: "#BF4E00"
  deep-black: "#111111"
  on-deep-black: "#FFFFFF"
  surface-dark-elevated: "#1A1A1A"
  on-surface-dark-elevated: "#F5F5F5"
  pure-white: "#FFFFFF"
  on-pure-white: "#111111"
  light-gray: "#F5F5F5"
  on-light-gray: "#111111"
  muted-gray: "#666666"
  outline-subtle: "#E5E5E5"
  outline-dark: "#2E2E2E"
```

## Typography

Inter is used across all display, headline, body, and label roles for geometric precision and crisp legibility at dense e-commerce scales. All currency figures (`₹`) and specification numbers use `tabular-nums`.

```yaml
typography:
  display-xl:
    fontFamily: "Inter"
    fontSize: 60px
    fontWeight: 700
    lineHeight: 64px
    letterSpacing: -1.6px
  display-xl-mobile:
    fontFamily: "Inter"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 38px
    letterSpacing: -0.6px
  headline-lg:
    fontFamily: "Inter"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 42px
    letterSpacing: -0.8px
  headline-lg-mobile:
    fontFamily: "Inter"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: -0.5px
  headline-md:
    fontFamily: "Inter"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: -0.4px
  title-lg:
    fontFamily: "Inter"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 26px
    letterSpacing: -0.2px
  title-md:
    fontFamily: "Inter"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 22px
    letterSpacing: -0.1px
  body-lg:
    fontFamily: "Inter"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-md:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  label-md:
    fontFamily: "Inter"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: 0px
  label-sm:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.2px
```

## Layout & Spacing

The desktop layout targets a `1440px` viewport with a `1360px` (`max-w-[1360px]`) centered content container and `48px` horizontal page gutters on desktop (`24px` on tablet, `16px` on mobile). Sections are separated by generous vertical rhythm (`64px`) and built on a 12-column CSS Grid on desktop that collapses cleanly to 2 columns on tablet and 1 column on mobile.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 64px
  page-margin: 48px
```

## Elevation & Depth

Hierarchy relies on high-contrast surface polarity (deep `#111111` vs. crisp `#FFFFFF` and `#F5F5F5`) and hairline `1px` `#E5E5E5` borders rather than heavy drop shadows. Glassmorphism, backdrop blurs, and decorative gradients are strictly avoided.

## Shapes

Cards, banners, and inputs use restrained, architectural radii: `4px` (`rounded-sm`) for buttons, inputs, and product frames; `6px` (`rounded`) for editorial containers; and `9999px` (`rounded-full`) reserved exclusively for circular icon-only buttons.

```yaml
rounded:
  sm: 4px
  DEFAULT: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
```

## Motion & Micro-interaction

Interactions are crisp and immediate. Button hovers, card border highlights, and chip selections transition color and transform in `150ms` with `ease-out`. Nothing loops or animates layout properties.

```yaml
motion:
  state-change:
    duration: 150ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 240ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
```

## Voice & Content Strategy

Copy is direct, technical, and confident. Headings use sentence case with a period for editorial punch ("Built for your next upgrade.", "Tell us what you need."). Product names include realistic model tiers and key specs, and all prices are formatted in Indian Rupees (`₹`) with comma grouping (e.g., `₹94,990`). Never display fabricated star ratings, review counts, or strikethrough discount percentages.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Chip** → `@components/chip.html`: `chip-action`, `chip-input`, `chip-with-icon`
- **Typography** → `@components/typography.html`: `typography-display`, `typography-body`, `typography-label`
