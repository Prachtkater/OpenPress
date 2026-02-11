# @openpress/theme-tailwind-plus

Modernes Theme basierend auf Tailwind CSS.

## Ziel

- Vollstaendiges Website-Theme mit Tailwind CSS
- Alle Core-Bloecke gestylt (Heading, Paragraph, Image, Video, Button)
- Responsive Design (Mobile-first)
- Dark Mode Support
- Customizable via `app.config.ts` und `ui` Prop
- Section-Templates: Hero, Feature Grid, CTA, Content, Footer

## Design-Prinzip

Strikte Trennung von Logik und Visuals. Das Theme definiert NUR das Aussehen.
Die Logik kommt vom Core und den Feature-Modulen.

## Komponenten

| Komponente | Slots | Variants |
|---|---|---|
| Section | root, inner | type: hero, features, cta, content, footer |
| Slot | root, empty | name: default, sidebar, media |
| Heading | root | level: 1-6 |
| Paragraph | root | size: sm, base, lg, xl |
| Image | root, img, caption | aspect: auto, square, video, wide / rounded: none-full |
| Button | root | size: sm-xl / variant: solid, outline, ghost, link / color: primary, secondary, neutral |
| Video | root, player, caption, overlay, playButton | rounded: none-lg |

## Status

Phase 1 - Basis-Implementierung (72/72 Tests passing)
