'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Download, Grid3X3, Info, Rows3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const prompts = [
  { label: 'Japanese tea', fileIndex: 2 },
  { label: 'Shoe', fileIndex: 1 },
  { label: 'Music', fileIndex: 3 },
  { label: 'Olive oil', fileIndex: 0 },
  { label: 'Skincare', fileIndex: 4 },
];
const models = [
  { folder: 'baseline', label: 'Base', note: 'Krea 2 Turbo', params: [['Model','Krea 2 Turbo'],['Training','No LoRA'],['Images','—'],['Steps','—'],['Learning rate','—'],['Rank / alpha','—'],['Prompt strategy','Native task prompt'],['Evaluation','8 steps · guidance 0']] },
  { folder: 'finetuned', label: 'V0', note: '33 images / 500 steps', params: [['Training model','Krea 2 Raw'],['Images','33'],['Steps','500'],['Learning rate','3e-4'],['Rank / alpha','32 / 32'],['Effective batch','1'],['Captioning','Generic instance prompt'],['Resolution','768 px']] },
  { folder: 'finetuned-v1', label: 'V1', note: '30 images / 750 steps', params: [['Training model','Krea 2 Raw'],['Images','30'],['Steps','750'],['Learning rate','3e-4'],['Rank / alpha','32 / 32'],['Effective batch','1'],['Captioning','Generic instance prompt'],['Resolution','768 px']] },
  { folder: 'finetuned-v2', label: 'V2', note: '58 images / 750 steps', params: [['Training model','Krea 2 Raw'],['Images','58'],['Steps','750'],['Learning rate','3e-4'],['Rank / alpha','32 / 32'],['Effective batch','1'],['Captioning','Generic instance prompt'],['Resolution','768 px']] },
  { folder: 'finetuned-v3', label: 'V3', note: '58 captioned / 500 steps', params: [['Training model','Krea 2 Raw'],['Images','58'],['Steps','500'],['Learning rate','1e-4'],['Rank / alpha','16 / 16'],['Effective batch','4'],['Captioning','Per-image captions'],['Resolution','768 px']] },
  { folder: 'finetuned-v4', label: 'V4', note: '428 reviewed / 1,200 steps', params: [['Training model','Krea 2 Raw'],['Images','428'],['Steps','1,200'],['Learning rate','1e-4'],['Rank / alpha','32 / 32'],['Effective batch','4'],['Captioning','Per-image captions'],['Optimizer','AdamW · 50 warmup']] },
  { folder: 'finetuned-v5', label: 'V5', note: '137 curated / 1,000 steps', params: [['Training model','Krea 2 Raw'],['Images','137'],['Steps','1,000'],['Learning rate','2e-4'],['Rank / alpha','32 / 32'],['Effective batch','4'],['Captioning','Style-only captions'],['Preprocessing','768 px · padded square'],['Optimizer','AdamW · 50 warmup']] },
  { folder: 'finetuned-v6', label: 'V6', note: '79 strict / 800 steps', params: [['Training model','Krea 2 Raw'],['Images','79'],['Steps','800'],['Learning rate','3e-4'],['Rank / alpha','32 / 32'],['Effective batch','4'],['Captioning','Strong shared style anchor'],['Preprocessing','768 px · padded square'],['Optimizer','AdamW · 50 warmup']] },
];
const strategies = [
  { label: 'V0', title: ['Establish the baseline.','Test the signal.'], specs: [['33','training images'],['500','optimization steps'],['3e-4','learning rate'],['32 / 32','LoRA rank / alpha'],['768 px','center crop'],['1','effective batch']], copy: 'V0 established the first LoRA baseline with 33 selected references and a generic instance prompt. The short, high-learning-rate run tested whether a compact dataset could move Krea 2 toward the Swiss poster language without changing the evaluation setup.' },
  { label: 'V1', title: ['Tighten the set.','Extend the run.'], specs: [['30','training images'],['750','optimization steps'],['3e-4','learning rate'],['32 / 32','LoRA rank / alpha'],['768 px','center crop'],['1','effective batch']], copy: 'V1 narrowed the source set to 30 images while extending training to 750 steps. It tested whether stronger repetition over a tighter visual vocabulary would produce a more consistent style response.' },
  { label: 'V2', title: ['Broaden the set.','Hold the recipe.'], specs: [['58','training images'],['750','optimization steps'],['3e-4','learning rate'],['32 / 32','LoRA rank / alpha'],['768 px','center crop'],['1','effective batch']], copy: 'V2 expanded the dataset to the complete original 58-image foundation while preserving the V1 optimization recipe. This isolated the effect of greater visual variety from changes to the learning rate, rank, resolution, or batch.' },
  { label: 'V3', title: ['Describe the image.','Lower the pressure.'], specs: [['58','captioned images'],['500','optimization steps'],['1e-4','learning rate'],['16 / 16','LoRA rank / alpha'],['768 px','center crop'],['4','effective batch']], copy: 'V3 introduced a distinct content-aware caption for every source image, reduced the learning rate and LoRA rank, and increased the effective batch. The strategy aimed to separate reusable design language from the literal subjects in the references.' },
  { label: 'V4', title: ['Scale the system.','Keep the signal.'], specs: [['428','reviewed images'],['1,200','optimization steps'],['1e-4','learning rate'],['32 / 32','LoRA rank / alpha'],['768 px','center crop'],['4','effective batch']], copy: 'V4 combines 370 images accepted in a human pass/fail review with the original 58-image set. Every image has a content-aware caption beginning with swissposter style. The final run used a stable square preprocessing path after aspect-ratio bucketing produced non-finite gradients during two discarded attempts.' },
  { label: 'V5', title: ['Reduce the noise.','Describe the style.'], specs: [['137','curated images'],['1,000','optimization steps'],['2e-4','learning rate'],['32 / 32','LoRA rank / alpha'],['768 px','padded square'],['4','effective batch']], copy: 'V5 combines 79 strict poster selections with the original 58-image foundation. Captions emphasize reusable layout, typography, color, geometry, and print attributes while avoiding subject-heavy descriptions. Padded square preprocessing preserves the complete poster composition instead of cropping its edges.' },
  { label: 'V6', title: ['Purify the signal.','Increase the pressure.'], specs: [['79','strict images'],['800','optimization steps'],['3e-4','learning rate'],['32 / 32','LoRA rank / alpha'],['768 px','padded square'],['4','effective batch']], copy: 'V6 removes the broader 58-image foundation and trains only on 79 strict Swiss poster selections. A stronger shared caption anchor—swissposter style, flat graphic poster, typographic grid—raises style pressure while per-image attributes preserve visual variety. The evaluation prompts, seeds, dimensions, and inference settings remain unchanged from V3–V5.' },
];
const trainingFiles = Array.from({length:428},(_,i)=>`${String(i+1).padStart(4,'0')}.jpg`);

function RunParameters({ model }: { model: (typeof models)[number] }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  return <Tooltip
    open={open}
    onOpenChange={(nextOpen, details) => {
      if (details.reason === 'trigger-press') {
        return;
      }
      if (details.reason === 'outside-press' || details.reason === 'escape-key') {
        setPinned(false);
        setOpen(false);
        return;
      }
      if (!pinned) setOpen(nextOpen);
    }}
  >
    <TooltipTrigger
      className="run-info"
      aria-label={`Show ${model.label} run parameters`}
      aria-pressed={pinned}
      onClick={() => {
        const nextPinned = !pinned;
        setPinned(nextPinned);
        setOpen(nextPinned);
      }}
    >
      <Info size={13}/><span>Parameters</span>
    </TooltipTrigger>
    <TooltipContent className="run-tooltip" side="bottom" align="start" sideOffset={9}>
      <div className="run-tooltip-title"><span>{model.label}</span><strong>{model.note}</strong></div>
      <dl>{model.params.map(([term,value])=><div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
    </TooltipContent>
  </Tooltip>;
}

export default function Home() {
  const [activePrompt,setActivePrompt]=useState(0);
  const [activeStrategy,setActiveStrategy]=useState(6);
  const [visibleModels,setVisibleModels]=useState(models.map(m=>m.folder));
  const [mode,setMode]=useState<'rows'|'grid'>('rows');
  const selected=useMemo(()=>models.filter(m=>visibleModels.includes(m.folder)),[visibleModels]);
  const strategy=strategies[activeStrategy];
  const activePromptData=prompts[activePrompt];
  const toggle=(folder:string)=>setVisibleModels(current=>current.includes(folder)?(current.length===1?current:current.filter(x=>x!==folder)):[...current,folder]);
  return <main>
    <header className="masthead"><a className="brand" href="#top"><span>K2</span><b>Swiss Poster Study</b></a><nav><a href="#compare">Compare</a><a href="#training">Training set</a><a href="#method">Method</a></nav><a className="download" href="/captions.csv" download><Download size={15}/> Captions</a></header>
    <section className="intro" id="top"><p className="eyebrow">MODEL EVALUATION / 2026</p><h1><span>Fine Tuning</span><span>Krea K2 for Swiss Poster</span><span>Design Styles</span></h1><div className="intro-copy"><p>A controlled visual study of how successive LoRA training strategies move Krea 2 toward a Swiss poster language.</p><div className="counter"><strong>160</strong><span>outputs</span></div><div className="counter"><strong>79</strong><span>strict V6 images</span></div></div></section>
    <section className="workspace" id="compare">
      <div className="controls"><div className="prompt-tabs" role="tablist" aria-label="Prompt">{prompts.map((prompt,i)=><button key={prompt.label} className={activePrompt===i?'active':''} onClick={()=>setActivePrompt(i)}><small>0{i+1}</small>{prompt.label}</button>)}</div><div className="view-toggle"><button className={mode==='rows'?'active':''} onClick={()=>setMode('rows')} aria-label="Rows"><Rows3 size={17}/></button><button className={mode==='grid'?'active':''} onClick={()=>setMode('grid')} aria-label="Grid"><Grid3X3 size={17}/></button></div></div>
      <div className="model-filter"><span>SHOW MODELS</span>{models.map(model=><button key={model.folder} className={visibleModels.includes(model.folder)?'selected':''} onClick={()=>toggle(model.folder)}><i>{visibleModels.includes(model.folder)&&<Check size={11}/>}</i>{model.label}<small>{model.note}</small></button>)}</div>
      <TooltipProvider delay={140}><div className={`comparison ${mode}`} style={{'--columns':selected.length} as React.CSSProperties}><div className="model-heads"><span>SEED</span>{selected.map(m=><div className="model-head" key={m.folder}><div><b>{m.label}</b><small>{m.note}</small></div><RunParameters model={m}/></div>)}</div>{[0,1,2,3].map(seed=><div className="seed-row" key={seed}><div className="seed-label"><span>0{seed}</span><small>seed</small></div>{selected.map(model=><figure key={model.folder}><a href={`/models/${model.folder}/prompt_${activePromptData.fileIndex}_seed_${seed}.jpg`} target="_blank"><img src={`/models/${model.folder}/prompt_${activePromptData.fileIndex}_seed_${seed}.jpg`} alt={`${activePromptData.label}, ${model.label}, seed ${seed}`}/></a><figcaption><b>{model.label}</b><span>Seed {seed}</span></figcaption></figure>)}</div>)}</div></TooltipProvider>
    </section>
    <section className="method" id="method"><div className="strategy-tabs" role="tablist" aria-label="Training strategy">{strategies.map((item,index)=><button key={item.label} role="tab" aria-selected={activeStrategy===index} className={activeStrategy===index?'active':''} onClick={()=>setActiveStrategy(index)}><span>{item.label}</span><small>{models[index+1].note}</small></button>)}</div><div role="tabpanel" aria-label={`${strategy.label} training strategy`}><p className="eyebrow">{strategy.label} TRAINING STRATEGY</p><h2>{strategy.title.map(line=><span key={line}>{line}</span>)}</h2></div><div className="spec-grid">{strategy.specs.map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><p className="method-copy">{strategy.copy}</p></section>
    <section className="training" id="training"><div className="section-head"><div><p className="eyebrow">V4 SOURCE MATERIAL</p><h2>The reviewed training set</h2></div><p>All 428 captioned images used in V4: 370 human-approved references combined with the original 58-image foundation. V5 and V6 use stricter private research subsets documented in the method section.</p></div><div className="training-grid">{trainingFiles.map((file,i)=><figure key={file}><a href={`/training-v4/${file}`} target="_blank"><img src={`/training-v4/${file}`} alt={`V4 training image ${i+1} of 428`} loading="lazy"/></a><figcaption><span>{String(i+1).padStart(4,'0')}</span><a href="/training-v4-captions.csv" download>caption <ChevronDown size={12}/></a></figcaption></figure>)}</div></section>
    <footer><b>K2 / SWISS POSTER STUDY</b><span>Base + seven LoRA experiments</span><a href="#top">Back to top ↑</a></footer>
  </main>;
}
