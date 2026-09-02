# K2 Swiss Poster Study

An interactive, matched-seed comparison of the Krea 2 Turbo base model and seven LoRA experiments trained toward a Swiss poster visual language.

**Live study:** https://comparison-site-rho.vercel.app

## What is included

- 160 generated evaluation images: five prompts, four seeds, and eight model states
- 428 reviewed V4 training reference images
- Individual captions for the V3 training set
- Interactive controls for switching prompts, hiding model versions, and changing the comparison layout
- A documented experiment history from V0 through V6

## Results at a glance

| Model | Images | Steps | Learning rate | Rank / alpha | Caption strategy |
| --- | ---: | ---: | ---: | ---: | --- |
| Base | - | - | - | - | Krea 2 Turbo without LoRA |
| V0 | 33 | 500 | `3e-4` | 32 / 32 | One generic instance prompt |
| V1 | 30 | 750 | `3e-4` | 32 / 32 | One generic instance prompt |
| V2 | 58 | 750 | `3e-4` | 32 / 32 | One generic instance prompt |
| V3 | 58 | 500 | `1e-4` | 16 / 16 | One descriptive caption per image |
| V4 | 428 | 1,200 | `1e-4` | 32 / 32 | Human-reviewed set with one descriptive caption per image |
| V5 | 137 | 1,000 | `2e-4` | 32 / 32 | Style-only captions on a tighter curated set |
| V6 | 79 | 800 | `3e-4` | 32 / 32 | Strict set with a stronger shared style anchor |

V5 and V6 test whether stronger curation and captions focused on reusable visual attributes can recover Swiss poster structure lost in the broader V4 set. V5 uses 79 strict selections plus the original 58-image foundation; V6 trains only on the 79 strict selections with a stronger common caption anchor. Both preserve each full poster with padded-square preprocessing.

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
- `public/models/` - optimized web copies of Base and V0-V6 outputs
- `public/training-v4/` - optimized web copies of the 428 reviewed V4 training images
- `public/captions.csv` - V3 image captions
- `docs/` - experiment methodology and asset notes

The web images are optimized display copies. Original 1024px evaluation PNGs, the trained LoRA weights, and the full-resolution PDF are not stored in this repository.

## Asset note

The training references include third-party visual material assembled for research and evaluation. No license is granted for those images by this repository. Review [docs/ASSETS.md](docs/ASSETS.md) before redistributing or reusing them.
