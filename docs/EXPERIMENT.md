# Experiment methodology

## Objective

The study tests how a LoRA can shift Krea 2 outputs toward the design logic of Swiss posters while preserving the model's ability to respond to new brand briefs. The target is a transferable visual system: structured grids, deliberate typography, restrained palettes, bold geometry, photographic or illustrative contrast, and print-like composition.

## Dataset development

The dataset evolved across three stages:

1. **V0:** 33 usable images from the original LORA Photos collection.
2. **V1:** A deterministic 30-image subset, sampled with seed 42, used with a longer 750-step budget.
3. **V2 and V3:** 58 images formed by combining LORA Photos with Swiss Poster Data Set 2.

The final 58-image set spans geometric systems, typography-led grids, photographic collage, product and travel advertising, editorial layouts, and mid-century illustration.

## Caption strategy

V0-V2 applied the same instance prompt to every image:

```text
experimental brand exploration image
```

V3 uses a separate caption for each image. Every caption begins with:

```text
swissposter style
```

The remainder describes only perceived visual attributes, typically:

- grid and composition
- typography and hierarchy
- palette and contrast
- geometric or photographic content
- period, print, or editorial character

Example:

```text
swissposter style, orange modular semicircles, strict geometric grid,
oversized lowercase sans serif lettering, abundant white space,
minimal two-color layout
```

The complete caption set is available in `public/captions.csv`.

## Training matrix

| Setting | V0 | V1 | V2 | V3 |
| --- | ---: | ---: | ---: | ---: |
| Training images | 33 | 30 | 58 | 58 |
| Steps | 500 | 750 | 750 | 500 |
| Approx. exposures per image | 15.2 | 25.0 | 12.9 | 8.6 |
| Resolution | 768 | 768 | 768 | 768 |
| Precision | bf16 | bf16 | bf16 | bf16 |
| Batch size | 1 | 1 | 1 | 1 |
| Gradient accumulation | - | - | - | 4 |
| LoRA rank / alpha | 32 / 32 | 32 / 32 | 32 / 32 | 16 / 16 |
| Optimizer | 8-bit AdamW | 8-bit AdamW | 8-bit AdamW | 8-bit AdamW |
| Learning rate | `3e-4` | `3e-4` | `3e-4` | `1e-4` |
| Scheduler / warmup | constant / 0 | constant / 0 | constant / 0 | constant / 0 |
| Seed | 42 | 42 | 42 | 42 |

Shared checkpoints:

- Training model: `krea/Krea-2-Raw`
- Validation and inference model: `krea/Krea-2-Turbo`
- Gradient checkpointing: enabled
- Latent caching: enabled

V3 saved checkpoints every 100 steps. Automatic aspect-ratio bucketing was tested, but the installed Krea2 training path produced non-finite loss. That attempt was stopped immediately. A 12-step square-preprocessing smoke test remained finite, after which the complete V3 run finished normally at 500 steps.

## Evaluation protocol

Every model state was evaluated on the same five tasks and seeds 0-3 at 1024 x 1024 pixels, using eight inference steps and guidance scale 0.

The five brand tasks were:

1. Premium California olive oil: sophisticated, contemporary, culturally relevant, and slightly strange.
2. Experimental running shoes for creative professionals.
3. A luxury Japanese tea company entering the American market.
4. A new AI music company with an underground cultural identity.
5. High-end skincare inspired by biology and science.

V3 prompts begin with `swissposter style`. Earlier fine-tuned runs use `experimental brand exploration image`. The Base prompts contain neither learned trigger. The gallery therefore compares the saved experiment states rather than serving as a strict prompt-controlled LoRA ablation.

## Reading the comparison

Use the prompt tabs to change the brand task. Each row preserves one seed across all visible model states, making changes in composition and style easier to attribute to the model. Hide intermediate versions to compare Base directly with V3, or switch to the grid layout for a denser overview.

The gallery is intended for qualitative assessment of:

- strength of Swiss poster structure
- prompt and subject fidelity
- diversity across seeds
- typography and layout behavior
- undesirable content or style collapse

