# MATERNALINK | Unified Master UI/UX Design System & Brand Architecture

*The "Serene Twilight Meadow & Frosted Glass" Light Theme Specification for Regional Digital Healthcare & AI Telemetry*

---

## 1. Visual Philosophy & Strategic Paradigms

Maternalink synthesizes three premier contemporary design movements into a specialized, high-performance light visual identity. This architecture bridges advanced clinical data parsing (**Gemma AI**) with an empathetic, high-visibility light-theme frontend deployed for healthcare infrastructure in the Tharparkar region.

```
       ┌────────────────────────────────────────────────────────┐
       │             MATERNALINK TRI-AXIS LIGHT PARADIGM        │
       └───────────────────────────┬────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
 │ MEADOW CANVAS │         │ FROSTED BENTO │         │ SHIELD OF EASE│
 │ TWILIGHT MIST │         │ TELEMETRY GRID│         │ EMOTIONALISM  │
 └───────┬───────┘         └───────┬───────┘         └───────┬───────┘
         │                         │                         │
         ▼                         ▼                         ▼
• Calming pastel mist     • Modular patient boxes   • Atmospheric trust curves
• Elegant charcoal text   • Asymmetric risk parsing • Tactile micro-interactions
• High performance scale  • Soft glass layers       • Serene maternal comfort
```

### The Integrated Design Ideals:

* **Meadow Canvas Twilight Mist:** Promotes clean, welcoming comfort for clinical users and community mothers, reflecting hope and security under the desert sky.
* **Frosted Bento Telemetry Grid:** Structures dense, multi-layered clinical streams (vital signs, maternal profiles, obstetric histories, and live dispatches) into translucent frosted cards for quick scanning.
* **Shield of Ease Emotionalism:** Blends pastel horizon hues inspired by the Tharparkar sky at dusk with rounded, organic shapes to reduce clinical anxiety while maintaining authority.

---

## 2. Color Specification & Token Architecture

The light-theme palette uses a carefully balanced color map designed to reflect warmth and trust while ensuring excellent typographic legibility.

### Core Token Palette

| Swatch | Token Name | Hex Code | HSL Coordinate | Functional Application |
| --- | --- | --- | --- | --- |
| 🌌 | `color-canvas-sky` | `#dfd6e4` | H: 275° S: 18% L: 87% | Base twilight violet canvas, sweeping into warm peach. |
| 🌸 | `color-canvas-peach` | `#f7ebe8` | H: 10° S: 43% L: 94% | Mid-ground warm horizon gradient tone. |
| 🍑 | `color-canvas-cream` | `#ebdcd5` | H: 20° S: 31% L: 88% | Bottom-ground comforting sand clay gradient. |
| ◽ | `color-surface-glass` | `rgba(255,255,255,0.45)` | H: 0° S: 0% L: 100% (A:45%) | Translucent frosted glass bento block surface. |
| 🔮 | `color-brand-plum` | `#3b2f42` | H: 280° S: 16% L: 22% | Primary editorial branding voice, header typography, and deep text fields. |
| 🍇 | `color-text-slate` | `#5c4a63` | H: 281° S: 14% L: 34% | High-readability body copy, patient status labels, and clinical vitals descriptions. |
| 🟢 | `color-trigger-sage` | `#ebdcd5` | H: 20° S: 31% L: 88% | Refined soft sage/sand shade for successful triggers and secondary buttons. |
| 🚨 | `color-alert-rose` | `#f5e3e6` | H: 348° S: 46% L: 92% | Refined soft rose alert block for high-risk maternal notifications. |

### Color Mapping Architecture

```
[ CANVAS SKY: #dfd6e4 ] ── [ HORIZON PEACH: #f7ebe8 ] ── [ CLAY SAND: #ebdcd5 ]
   │
   └── [ TRANS-MILKY BENTO GLASS: rgba(255,255,255,0.45) ] ── ( Border: rgba(255,255,255,0.6) )
          │
          ├── [ CLINICAL METRIC TEXT: #3b2f42 ]
          ├── [ STABLE SAGE ACCENT: #214d18 ] ── ( In-bounds parameters )
          └── [ ROSE SIGNAL ALARM: #731a26 ] ── ( Alert state indicator )
```

---

## 3. Typographic Systems & Localized Scale

Typography is characterized by wide-set, elegant geometric weights that provide a clean, modern aesthetic similar to premium consumer portals.

### Typeface Roles

* **Primary System & Brand Architecture:** **Outfit Sans-Serif**. An ultra-clean geometric sans-serif that softens clinical coldness and delivers high-end editorial authority.
* **Clinical Telemetry & Metrics:** **Inter Neo-Grotesque**. Offers high legibility for blood pressure figures, diagnostic readings, and patient lists.
* **Localized Contextual Information:** **Noto Naskh Arabic**. Highly optimized for Urdu and Sindhi script renderings.

### System Hierarchy Specification

```
[H1 MAIN DASHBOARD BRANDING]
 Font: Outfit Light/Regular | Size: 48pt / 6rem | Tracking: -0.03em | Case: Minimalist Sentence
 Purpose: Aesthetic headers and brand statements (e.g. "Obstetric care inspired by nature").

[H2 SECTION MODULAR HEADERS]
 Font: Outfit Semi-Bold | Size: 20pt / 2.5rem | Tracking: -0.01em | Case: Title Case
 Purpose: Module titles and ledger section categories.

[METRIC TELEMETRY READOUTS]
 Font: Inter Bold | Size: 32pt - 40pt | Tracking: -0.03em | Line-Height: Tight (1.1)
 Purpose: Vitals measurements (e.g. 120/80 mmHg).

[SYSTEM BODY COPY]
 Font: Inter Medium | Size: 13px / 0.8125rem | Leading: 1.6
 Purpose: Diagnostic insights and maternal medical guides.
```

---

## 4. Layout Architecture: The Serene Bento Grid

Layouts are designed with modular bento cards that float over the twilight sky canvas, utilizing generous margins and clean lines.

### Structural Asymmetry Blueprint

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│                                       │  [ MODULE 2: CLINICAL VITALS ]        │
│  [ MODULE 1: COMPREHENSIVE IDENT ]    │  - BP: 120/80 mmHg (Inter Bold)       │
│  - Full Identity Matrix & CNIC        │  - Color Tag: Sage Stable             │
│  - Regional Tracker (Tharparkar Sector)├───────────────────────────────────────┤
│  - Status Tag: Active Field Monitoring │  [ MODULE 3: AI DISPATCH INSIGHTS ]   │
│                                       │  - Gemma Risk Profile Matrix          │
│                                       │  - High-Vis Tag Tracking Icons        │
│ ├──────────────────────────────────────┴───────────────────────────────────────┤
│  [ MODULE 4: PRIMARY ACTION TRIGGER ]                                          │
│  - Solid Slate Charcoal Block (#3b2f42)                                        │
│  - Label: COMPOSE NEW TELEMETRY CARD (Outfit Semi-Bold, White Text)           │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Card Engineering Specification

To maintain structural integrity across mobile viewports, glass containers adhere to these design parameters:

```css
.maternalink-bento-card {
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px) saturate(110%);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 15px 35px rgba(70, 50, 80, 0.03);
  transition: border-color 0.3s cubic-bezier(0.25, 1, 0.5, 1), 
              transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
```

* **Radius Hierarchy:** Outer containers strictly use `28px` to `32px` corner rounding. Internal labels and tags use a `100px` pill boundary.
* **Layout Spans:** Dashboard designs are organized on a 12-column grid.

---

## 5. Micro-Affordances & Animation Specifications

### 1. Gemma AI Voice Processing Pulse
Glow cycles indicate active voice-dictation status without disrupting interaction:

```css
@keyframes gemma-light-pulse {
  0% { box-shadow: 0 0 0 0 rgba(118, 94, 130, 0.15); }
  50% { box-shadow: 0 0 0 16px rgba(118, 94, 130, 0); }
  100% { box-shadow: 0 0 0 0 rgba(118, 94, 130, 0); }
}
```

### 2. Acute Emergency Obstetric Beacon
Severe patient alerts animate using soft scale oscillations:

```css
@keyframes clinical-beacon-alert {
  0% { transform: scale(0.98); }
  50% { transform: scale(1.02); }
  100% { transform: scale(0.98); }
}
```

---

## 6. Production Reference: Tailwind CSS Components

### 1. Master Brand Light Header

```html
<h1 class="text-5xl md:text-7xl font-light tracking-tight text-[#3b2f42] leading-[1.08] font-sans">
  Obstetric care inspired by <span class="font-semibold text-[#543b61]">nature & safety</span>
</h1>
```

### 2. Production Frosted Bento Component

```html
<div class="bg-white/45 backdrop-blur-xl border border-white/60 rounded-[28px] p-6 shadow-[0_15px_35px_rgba(70,50,80,0.03)] hover:border-white/90 transition-all duration-300">
  <div class="flex items-center justify-between mb-4">
    <span class="text-[9px] font-extrabold tracking-wider text-[#765e82] uppercase">Obstetric Matrix</span>
    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
  </div>
  <p class="text-3xl font-bold font-mono text-[#3b2f42] tracking-tighter">120/80</p>
  <p class="text-[10px] text-[#5c4a63] mt-1 font-semibold">SYS/DIA mmHG — Stable Vitals</p>
</div>
```

### 3. High-End Editorial Button

```html
<button class="w-full py-3.5 px-6 bg-[#3b2f42] hover:bg-[#52415c] text-white font-sans font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
  Register Antenatal Outcome
</button>
```