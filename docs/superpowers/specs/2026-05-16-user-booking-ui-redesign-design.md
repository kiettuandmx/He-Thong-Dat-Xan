# User Booking UI Redesign Design

Date: 2026-05-16
Project: He-Thong-Dat-Xan-develop
Scope: User-facing booking experience
Status: Draft approved in conversation, awaiting user review of written spec

## 1. Goal

Redesign the user-facing booking UI for the sports field booking system with a modern, energetic sports aesthetic while preserving existing functionality.

This redesign focuses on the user booking flow first. Owner and admin areas are out of scope for implementation in this phase, but the visual system should be designed so those areas can adopt it later.

## 2. Product Direction

The redesign follows these confirmed choices:

- Visual direction: modern, sporty, energetic
- Primary audience focus: end users booking fields
- Product emphasis: discovering fields with richer visual presentation and clearer information
- Layout change level: major layout refresh for key pages, with existing functionality preserved
- Device priority: balanced responsive experience across desktop and mobile
- Brand color direction: replace the old green-led palette with a stronger sports-oriented palette
- Typography rule: one font family only across the entire frontend
- Language rule: all UI copy must be Vietnamese except unavoidable brand names or widely understood English terms

## 3. Recommended Approach

The chosen approach is `Sports Marketplace`.

Why this approach:

- It fits the current React/Vite structure and existing routing with the least waste.
- It improves field discovery without requiring a product rewrite.
- It gives the system a strong visual identity centered on field cards, search, and detail pages.
- It creates a reusable component foundation for later owner and admin redesign work.

Approaches considered but not chosen:

- `Discovery First`: richer editorial storytelling, but requires more net-new sections and content structure.
- `Quick Booking Hybrid`: faster utility flow, but weaker for the stated goal of showcasing fields beautifully.

## 4. Design Principles

- Keep existing business behavior intact unless a UI restructuring requires a safer presentation of the same behavior.
- Prioritize image-led browsing and quick visual comparison between fields.
- Make important booking information easy to scan: field type, location, price, availability, rating, and booking CTA.
- Use one visual language across all user pages instead of page-by-page styling.
- Avoid Bootstrap-default visual feel even if Bootstrap utilities remain in use.
- Keep mobile interaction intentional, not just compressed desktop layouts.
- Use Vietnamese consistently across menus, buttons, placeholders, empty states, system states, and helper text.

## 5. Information Architecture

### 5.1 Primary user pages in scope

- Home/listing entry experience at `/`
- Sport-specific listing pages at `/football`, `/badminton`, `/pickleball`
- Field detail page at `/field/:id`
- Stadium detail page at `/stadium/:id`
- User account pages:
  - `/history`
  - `/favorites`
  - `/payment-history`
  - `/profile`
  - `/complaints`
  - `/my-reviews`

### 5.2 Experience hierarchy

1. Discover fields
2. Compare fields visually
3. Inspect schedule and details
4. Book confidently
5. Review personal activity in a consistent account shell

## 6. Key Screen Design

### 6.1 Main layout and navigation

`MainLayout` should become a cleaner shared shell for user pages.

Requirements:

- Sticky header with stronger branding and more deliberate spacing
- Unified navigation labels in Vietnamese
- Cleaner account entry point and mobile menu behavior
- Shared page background and section rhythm
- Future-safe structure so owner/admin can later reuse selected tokens and header ideas without forcing identical layouts

### 6.2 Listing page

`FieldListPage` becomes the true discovery homepage.

Structure:

- Hero section with bold headline, short supporting copy, and high-contrast search emphasis
- Quick sport chips for common entry points
- Context bar below hero with result count, active filters, and sort control
- Sticky filter panel on desktop
- Grid of richer field cards
- Better no-results and loading states

Behavior:

- Existing filter/search functionality remains
- Layout changes significantly, but APIs and filtering behavior stay aligned with current implementation
- Sport pages reuse the same listing structure with sport-specific default context and copy

### 6.3 Field card

`FieldCard` becomes the core visual component.

Content priority:

- Large image
- Field type badge
- Availability status
- Favorite action
- Field name
- Short location
- Price per hour
- Rating or social proof when available
- Booking CTA

Interaction:

- Light hover lift and image zoom on desktop
- Large tap targets on mobile
- Visual distinction between metadata and primary action
- Clear saved/favorited state

### 6.4 Field and stadium detail

`FieldDetail` and `StadiumDetail` must support the "discover before booking" goal better than the current implementation.

Requirements:

- Strong visual hero or gallery
- Clear top summary block with name, location, field type, pricing, status, and rating
- Prominent schedule/booking area
- Sections for description, amenities, images, reviews, and related fields when data exists
- Sticky or persistent booking action on small screens

Note:

- `StadiumDetail` is currently underdeveloped and needs a meaningful UI instead of placeholder content.

### 6.5 User account pages

`BookingHistory`, `FavoritesPage`, `PaymentHistory`, `ProfilePage`, `MyComplaints`, and `MyReviews` should share one account visual shell.

Requirements:

- Shared section header style
- Unified card/list design language
- Vietnamese copy standardization
- Clear empty states and supporting actions
- Better spacing and typography consistency

These pages do not need the same visual drama as discovery pages, but must clearly belong to the same product.

## 7. Visual System

### 7.1 Typography

- Use exactly one font family across the entire frontend
- Differentiate hierarchy using size, weight, line-height, and spacing only
- Headings should feel bold and athletic
- Body text must remain readable on mobile and desktop

### 7.2 Color system

The palette should shift away from the current green-first look.

Proposed roles:

- Background: clean light neutral or cool white
- Primary text: deep charcoal
- Primary accent: energetic orange or orange-red for CTAs and attention moments
- Secondary semantic accent: field-green for availability and sports context
- Supporting neutrals: soft gray scale for surfaces, borders, and subdued metadata

Rules:

- Orange-led accents should drive calls to action and key highlights
- Green remains semantic, not dominant brand color
- Colors should support contrast and accessibility

### 7.3 Components

The design system for this phase must define consistent styling for:

- Buttons
- Search bar
- Filter chips
- Form controls
- Field cards
- Status badges
- Section headers
- Empty states
- Sticky panels

### 7.4 Motion

Motion should be restrained but meaningful.

Allowed motion patterns:

- Card hover lift
- Subtle image zoom
- Smooth drawer/filter transitions
- Gentle section reveal

Avoid decorative animation that does not improve comprehension or perceived responsiveness.

## 8. Language and Content Rules

- All user-facing copy should be Vietnamese by default
- Keep only unavoidable or natural English terms such as product names, payment brands, or widely understood technical labels
- Standardize labels across pages so the same concept is never named multiple ways
- Fix existing mixed-language labels, broken accents, and encoding issues

Examples of areas to standardize:

- navigation labels
- buttons
- placeholders
- toasts
- status text
- empty state copy
- loading and error messages

## 9. Data Presentation Rules

Each field card and detail page should prioritize the information users need to judge field quality quickly:

- image
- field/stadium name
- sport type
- area or district
- price per hour
- availability
- rating
- number of reviews
- booking action

Secondary or technical data should appear later in the hierarchy.

## 10. System States

The redesign must standardize these states across the user experience:

- loading
- empty
- no results
- error
- disabled

Requirements:

- Prefer skeletons or structured placeholders over spinner-only experiences where practical
- Empty states must explain what happened in Vietnamese and offer a next action
- Error states must avoid raw technical wording
- No-results states should support recovery, such as clearing filters or returning to the main listing

## 11. Responsive Rules

### Desktop

- Showcase imagery and card composition
- Keep filters visible and sticky where useful
- Allow multi-column comparison in listings

### Tablet

- Reduce hero height and tighten section spacing
- Reduce listing columns
- Keep filters accessible without overwhelming content

### Mobile

- Move filters into a drawer or bottom sheet
- Preserve prominent booking actions with sticky behavior where needed
- Keep cards readable with thumb-friendly actions
- Reorder content to show the most useful information first

Responsive behavior should be designed intentionally instead of only scaling down desktop layouts.

## 12. Implementation Scope for Phase 1

Phase 1 implementation should focus on the highest-impact user booking surfaces:

- `frontend/src/components/MainLayout.jsx`
- `frontend/src/pages/FieldListPage.jsx`
- `frontend/src/components/FieldCard.jsx`
- `frontend/src/components/FilterSidebar.jsx`
- `frontend/src/pages/FieldDetail.jsx`
- `frontend/src/pages/StadiumDetail.jsx`
- `frontend/src/pages/FavoritesPage.jsx`
- `frontend/src/pages/BookingHistory.jsx`
- `frontend/src/pages/PaymentHistory.jsx`
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/App.css`
- `frontend/src/index.css`

Also included in phase 1:

- global font unification
- Vietnamese copy standardization
- fixing text encoding issues in affected UI

## 13. Out of Scope for Phase 1

- Backend behavior changes unrelated to UI support
- Owner dashboard redesign
- Admin dashboard redesign
- New booking business rules
- New recommendation or personalization engines

## 14. Error Handling and Testing Expectations

Design work should be validated through implementation checks for:

- visual consistency across the scoped pages
- responsive behavior on desktop and mobile widths
- Vietnamese copy consistency
- no accidental regression in routing or existing booking flows
- sensible rendering for loading, empty, and error states

## 15. Risks and Constraints

- Some current pages mix inline styles, Bootstrap classes, and ad hoc structure, so unification work may require moderate component cleanup.
- Existing encoding issues suggest some text may need explicit cleanup during implementation.
- `StadiumDetail` currently lacks a real experience and may require more design/build effort than the other scoped pages.
- The single-font requirement must be enforced globally or it will regress as more pages are touched later.

## 16. Success Criteria

This redesign is successful if:

- the user booking flow feels like one coherent product
- discovery pages feel richer and more image-led
- the UI uses one font family consistently
- the product copy is predominantly Vietnamese and no longer feels mixed or broken
- key pages are more modern and energetic without changing core functionality
- responsive behavior feels intentional on both mobile and desktop
