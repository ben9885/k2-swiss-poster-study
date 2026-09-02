# Experiment methodology

## Objective

The study tests how a LoRA can shift Krea 2 outputs toward the design logic of Swiss posters while preserving the model's ability to respond to new brand briefs. The target is a transferable visual system: structured grids, deliberate typography, restrained palettes, bold geometry, photographic or illustrative contrast, and print-like composition.

## Dataset development

The dataset evolved across four stages:

1. **V0:** 33 usable images from the original LORA Photos collection.
2. **V1:** A deterministic 30-image subset, sampled with seed 42, used with a longer 750-step budget.
3. **V2 and V3:** 58 images formed by combining LORA Photos with Swiss Poster Data Set 2.
4. **V4:** 370 images accepted through a human pass/fail review of a larger Cosmos-derived candidate pool, combined with the original 58 images for 428 captioned images total.

The V4 set contains 428 images. Source references and captions are retained privately; the web study continues to display the original 58-image foundation to avoid redistributing the larger research collection.

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

| Setting | V0 | V1 | V2 | V3 | V4 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Training images | 33 | 30 | 58 | 58 | 428 |
| Steps | 500 | 750 | 750 | 500 | 1,200 |
| Approx. exposures per image | 15.2 | 25.0 | 12.9 | 8.6 | 11.2 |
| Resolution | 768 | 768 | 768 | 768 | 768 |
| Precision | bf16 | bf16 | bf16 | bf16 | bf16 |
| Batch size | 1 | 1 | 1 | 1 | 1 |
| Gradient accumulation | - | - | - | 4 | 4 |
| LoRA rank / alpha | 32 / 32 | 32 / 32 | 32 / 32 | 16 / 16 | 32 / 32 |
| Optimizer | 8-bit AdamW | 8-bit AdamW | 8-bit AdamW | 8-bit AdamW | AdamW |
| Learning rate | `3e-4` | `3e-4` | `3e-4` | `1e-4` | `1e-4` |
| Scheduler / warmup | constant / 0 | constant / 0 | constant / 0 | constant / 0 | constant + warmup / 50 |
| Seed | 42 | 42 | 42 | 42 | 42 |

Shared checkpoints:

- Training model: `krea/Krea-2-Raw`
- Validation and inference model: `krea/Krea-2-Turbo`
- Gradient checkpointing: enabled
- Latent caching: enabled

V4 saved checkpoints every 200 steps. Automatic and explicit aspect-ratio bucketing both produced non-finite loss in the installed Krea2 training path, so those attempts and their corrupt checkpoints were discarded. The final 1,200-step run used 768-pixel center crops, completed with finite loss throughout, and passed tensor-integrity checks at steps 800, 1,000, and 1,200.

## Evaluation protocol

Every model state was evaluated on the same five tasks and seeds 0-3 at 1024 x 1024 pixels, using eight inference steps and guidance scale 0.

The five brand tasks were:

1. Premium California olive oil: sophisticated, contemporary, culturally relevant, and slightly strange.
2. Experimental running shoes for creative professionals.
3. A luxury Japanese tea company entering the American market.
4. A new AI music company with an underground cultural identity.
5. High-end skincare inspired by biology and science.

V3 and V4 prompts begin with `swissposter style`. Earlier fine-tuned runs use `experimental brand exploration image`. The Base prompts contain neither learned trigger. The gallery therefore compares the saved experiment states rather than serving as a strict prompt-controlled LoRA ablation.

## Reading the comparison

Use the prompt tabs to change the brand task. Each row preserves one seed across all visible model states, making changes in composition and style easier to attribute to the model. Hide intermediate versions to compare Base directly with V4, or switch to the grid layout for a denser overview.

The gallery is intended for qualitative assessment of:

- strength of Swiss poster structure
- prompt and subject fidelity
- diversity across seeds
- typography and layout behavior
- undesirable content or style collapse
