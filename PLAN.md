# Elegant Deck - Plan

## Vision
A mobile-first elegant deck manipulation game UI prototype focused on tactile browsing and reordering within a single deck.

## Core Goals
- Mobile-first layout
- Best experience in landscape, still usable in portrait
- Deck is the main experience and occupies most of the screen
- Show around 5 main cards clearly with partially visible overlapping cards at the edges
- Swipe horizontally through the deck like a gallery/carousel
- Long-press a card to begin drag interaction
- Allow dragging/reordering cards into another spot in the deck
- Start with placeholder content and strong visual feel

## Initial Prototype Scope
- React + Vite static app
- Single screen experience
- Fake card dataset with:
  - top-left number
  - centered title
  - short effect text
  - placeholder icons for feel
- Overlapping horizontal card rail
- Swipe / scroll through deck
- Long-press then drag to reorder
- Responsive behavior for landscape and portrait
- Elegant theme with polished motion and shadows

## Implementation Notes
- Prefer a custom card rail over a generic gallery if overlap control becomes awkward
- Keep interactions touch-friendly first, pointer second
- Use CSS scroll snapping and transforms where helpful
- Use a small icon library for placeholders

## Next Likely Steps
1. Build visual card rail
2. Add drag + reorder behavior
3. Tune mobile gestures
4. Add deploy config
5. Publish static page
