/**
 * Lumina Reader - Sample Markdown & Plain Text Book Generators
 * Generates rich sample documents with headings, blockquotes, code blocks, tables,
 * and editorial book prose for instant 1-click library demonstration.
 */

export function generateSampleMarkdown(): ArrayBuffer {
  const content = `# The Art of Zen Reading: A Digital Craft Treatise
*By Master Lin & The Lumina Guild*

> "The true book is not the paper, nor the screen, but the quiet space opened between the mind of the writer and the soul of the reader."

## Chapter I: The Architecture of Focus

In an era of relentless algorithmic notifications and fragmented attention, digital reading must be reclaimed as an intentional sanctuary. We design not to overwhelm, but to recede—giving ninety-five percent of the canvas to the written word.

When typography is harmonized with human perception, eye strain dissolves. The rhythmic cadence of line length, the gentle warmth of circadian palettes, and fluid column pagination restore the sacred bond of deep contemplation.

### Typographic Principles

A well-crafted digital page honors classical proportions while embracing responsive modern geometry:

| Metric | Ideal Range | Purpose |
| :--- | :--- | :--- |
| **Font Size** | 12px – 20px | Optimal legibility at resting arm distance |
| **Line Height** | 1.4 – 1.8 | Prevents vertical line crowding during eye sweeps |
| **Margins** | 10% – 25% | Frames content like generous classical margins |
| **Contrast** | Circadian OLED / Sepia | Softens blue light emission in low-light environments |

### Code as Thought

In technical manuscripts, code should read like poetry—monospaced, disciplined, and purposeful:

\`\`\`typescript
interface ReadingState {
  immersion: 'deep' | 'flow';
  distractions: 0;
  illumination: 'circadian';
}

function enterZenMode(reader: ReadingState): Promise<void> {
  return window.canvas.expandToFullWidth();
}
\`\`\`

## Chapter II: The Circadian Rhythm of Light

Words transform beneath shifting ambient hues. The pristine brilliance of high noon yields to the gentle amber embers of dusk:

- **OLED Dark**: Pure #000000 background for infinite contrast on emissive displays.
- **Slate Night**: Deep navy-gray tones that soothe nocturnal reading sessions.
- **Warm Sepia**: Evoking parchment manuscripts kissed by candle light.
- **Soft Paper**: The comforting touch of acid-free cream paper stock.
- **Crisp Light**: High-contrast daylight clarity for sunlit verandas.

Through these thoughtfully crafted environments, the digital reader finds equilibrium.`;

  return new TextEncoder().encode(content).buffer;
}

export function generateSamplePlainText(): ArrayBuffer {
  const content = `CHRONICLES OF THE IRON CITY
By J. R. Sterling

CHAPTER 1: THE STEAM GATES

The iron gates of Vaelen groaned as the pressure valves released their dawn sigh. Plumes of white steam billowed into the frosty mountain air, obscuring the colossal brass clockwork that crowned the citadel walls.

Master Mechanist Ethan Cross tightened his leather apron and wiped grease from his brass goggles. Below him in the central plaza, thousands of gears were already churning in synchrony, turning the great mill wheels that powered the lower foundries.

"Another cold sunrise, Ethan," remarked Kira, adjusting the gauge on her pneumatic wrench. "The boiler pressure in Sector 4 is fluctuating again."

"It's not the pressure, Kira," Ethan replied softly, peering into the deep vapor abyss. "The core is singing. Listen closely."

CHAPTER 2: ECHOES IN THE CORE

Down in the subterranean catacombs, two hundred leagues beneath the street cobblestones, sat the Heart of Vaelen—a sphere of resonant crystalline alloy discovered during the deep digs of the third era.

It did not burn coal, nor did it consume oil. It hummed with a low, vibrant frequency that resonated within the marrow of every living soul in the city.

Ethan placed his bare palm against the vibrating housing. For three generations, the guild had maintained the engines without truly understanding the intelligence that pulsed inside them. Today, the harmonic pattern had shifted.

The machine was no longer merely maintaining the city's power. It was attempting to communicate.`;

  return new TextEncoder().encode(content).buffer;
}
