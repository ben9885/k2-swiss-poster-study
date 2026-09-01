# K2 Swiss Poster Study

An interactive, matched-seed comparison of the Krea 2 Turbo base model and four LoRA experiments trained toward a Swiss poster visual language.

**Live study:** https://k2-swiss-poster-study.itsbennn.chatgpt.site

## What is included

- 100 generated evaluation images: five prompts, four seeds, and five model states
- 58 training reference images
- Individual captions for the V3 training set
- Interactive controls for switching prompts, hiding model versions, and changing the comparison layout
- A documented experiment history from V0 through V3

## Results at a glance

| Model | Images | Steps | Learning rate | Rank / alpha | Caption strategy |
| --- | ---: | ---: | ---: | ---: | --- |
| Base | - | - | - | - | Krea 2 Turbo without LoRA |
| V0 | 33 | 500 | `3e-4` | 32 / 32 | One generic instance prompt |
| V1 | 30 | 750 | `3e-4` | 32 / 32 | One generic instance prompt |
| V2 | 58 | 750 | `3e-4` | 32 / 32 | One generic instance prompt |
| V3 | 58 | 500 | `1e-4` | 16 / 16 | One descriptive caption per image |

V3 changes the training objective most substantially. Every image has a distinct caption beginning with the trigger `swissposter style`, followed by visible attributes such as grid, typography, color, geometry, imagery, and print character. The lower rank and learning rate aim to transfer the visual system while retaining prompt responsiveness.

See [docs/EXPERIMENT.md](docs/EXPERIMENT.md) for the complete methodology, prompts, and technical configuration.

## Run locally

Requirements: Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Create a production build with:

```bash
pnpm build
```

## Repository structure

- `app/` - comparison interface and visual system
- `public/models/` - optimized web copies of Base and V0-V3 outputs
- `public/training/` - optimized web copies of the 58 training images
- `public/captions.csv` - V3 image captions
- `docs/` - experiment methodology and asset notes

The web images are optimized display copies. Original 1024px evaluation PNGs, the trained LoRA weights, and the full-resolution PDF are not stored in this repository.

## Asset note

The training references include third-party visual material assembled for research and evaluation. No license is granted for those images by this repository. Review [docs/ASSETS.md](docs/ASSETS.md) before redistributing or reusing them.

