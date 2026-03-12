# Simple Manager – UI / UX Guidelines

This document defines the visual and user-experience guidelines for the application.

The goal is to create a **recognizable, calm, and professional interface** suitable for a medical/aesthetic clinic management tool.

The design should prioritize:

- clarity
- speed of use
- visual calm
- professional trust

The interface must remain **simple, minimal and consistent across all screens**.

---

# Design Philosophy

The visual style of the application should follow a **Medical Minimalism** approach.

Characteristics:

- clean backgrounds
- limited color palette
- clear typography hierarchy
- large tap targets for mobile
- high readability
- minimal visual noise

The interface should feel similar to modern productivity and medical dashboards such as:

- Notion
- Linear
- Stripe Dashboard
- modern medical record systems

---

# Color System

The color palette should be calm and elegant, suitable for healthcare and aesthetic clinics.

## Primary Palette

Primary colors are used for main actions and navigation highlights.

Primary: #7C9CF5
Secondary: #A8DADC
Accent: #F4A6A6

Meaning:

- Primary → main UI actions
- Secondary → supportive highlights
- Accent → soft visual differentiation

---

## Base Colors

Used for structure and readability.

Background: #F7F9FC
Surface: #FFFFFF
Border: #E5E7EB

Text: #1F2937
Subtext: #6B7280

Usage:

- Background → application background
- Surface → cards, modals, panels
- Border → separators and inputs
- Text → primary text
- Subtext → metadata and secondary information

---

## Status Colors

Used for feedback and system states.

Usage:

- Background → application background
- Surface → cards, modals, panels
- Border → separators and inputs
- Text → primary text
- Subtext → metadata and secondary information

---

## Status Colors

Used for feedback and system states.

Example uses:

- appointment completed → success
- appointment cancelled → error
- warnings → warning
- informational messages → info

---

# Color Distribution Rule

To maintain visual balance:

70% neutral colors
20% primary color
10% state colors

Avoid overusing accent colors.

---

# Component Style

## Cards

Cards should be used to display records, appointments and grouped information.

Recommended style:

background: white
border-radius: 12px
shadow: soft
padding: 16px

Cards should feel **light and spacious**, not heavy.

---

## Floating Action Button (FAB)

The application uses a floating action button for quick creation actions.

Style:

shape: circular
size: 56px
color: white
background: primary color
shadow: medium

Position:

bottom: 24px
right: 24px

This button should appear on all main screens.

---

## Inputs

Form inputs should remain simple and clean.

border-radius: 10px
border-color: light gray
padding: 12px
focus-color: primary color

Avoid heavy borders or complex decorations.

---

# Typography

Recommended font:

**Inter**

Alternatives:

- Roboto
- SF Pro (iOS)

Font hierarchy:

Title: 20–22px
Section: 16–18px
Body: 14–16px
Caption: 12px

Text should prioritize readability over decorative styling.

---

# Iconography

Icons should be simple and consistent.

Recommended libraries:

- Lucide
- Heroicons
- Feather Icons

Avoid mixing multiple icon styles.

Icons should support information rather than dominate the UI.

---

# Spacing System

Use an **8px spacing grid**.

Standard spacing values:

8px
16px
24px
32px

This ensures visual consistency and alignment.

---

# Appointment Status Colors

Appointments should be visually identifiable by status.

Example mapping:

Pending → Blue
Completed → Green
Cancelled → Red

These colors should appear subtly in badges or indicators.

---

# Animations

Animations should be short and subtle.

Recommended timing:

200ms
ease-out

Use animations for:

- modals
- toasts
- floating button interactions
- screen transitions

Avoid excessive motion.

---

# Empty States

Screens with no data should show a clear empty state.

Example:

No appointments today
Create a new appointment

Include a soft icon and a call-to-action button.

---

# Visual Consistency

The application should maintain a consistent visual identity using three main elements:

1. primary color
2. card layout
3. floating action button

If these elements remain consistent across screens, the product will feel cohesive.

---

# Medical UI Design Principles

Because the application manages patient information, the interface must feel:

- clean
- calm
- predictable
- professional

Avoid:

- overly saturated colors
- heavy gradients
- excessive shadows
- decorative elements that distract from data

---

# Theme System Recommendation

To maintain consistency, the application should define a centralized theme system.

Recommended structure:

src/theme/
colors.ts
spacing.ts
typography.ts

This allows the entire UI to use a shared design system instead of defining styles individually per screen.

---

# Final Design Goal

The final interface should feel:

- modern
- calm
- minimal
- trustworthy

The user should be able to quickly scan information and perform tasks with minimal friction.
