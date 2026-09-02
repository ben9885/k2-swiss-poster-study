'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Download, Grid3X3, Rows3 } from 'lucide-react';

const prompts = ['California olive oil','Experimental running shoes','Japanese tea','AI music','Biology-inspired skincare'];
const models = [
  { folder: 'baseline', label: 'Base', note: 'Krea 2 Turbo' },
  { folder: 'finetuned', label: 'V0', note: '33 images / 500 steps' },
  { folder: 'finetuned-v1', label: 'V1', note: '30 images / 750 steps' },
  { folder: 'finetuned-v2', label: 'V2', note: '58 images / 750 steps' },
  { folder: 'finetuned-v3', label: 'V3', note: '58 captioned / 500 steps' },
  { folder: 'finetuned-v4', label: 'V4', note: '428 reviewed / 1,200 steps' },
];
const trainingFiles = Array.from({length:58},(_,i)=>`${String(i+1).padStart(3,'0')}.jpg`);

export default function Home() {
  const [activePrompt,setActivePrompt]=useState(0);
  const [visibleModels,setVisibleModels]=useState(models.map(m=>m.folder));
  const [mode,setMode]=useState<'rows'|'grid'>('rows');
  const selected=useMemo(()=>models.filter(m=>visibleModels.includes(m.folder)),[visibleModels]);
  const toggle=(folder:string)=>setVisibleModels(current=>current.includes(folder)?(current.length===1?current:current.filter(x=>x!==folder)):[...current,folder]);
  return <main>
    <header className="masthead"><a className="brand" href="#top"><span>K2</span><b>Swiss Poster Study</b></a><nav><a href="#compare">Compare</a><a href="#training">Training set</a><a href="#method">Method</a></nav><a className="download" href="/captions.csv" download><Download size={15}/> Captions</a></header>
    <section className="intro" id="top"><p className="eyebrow">MODEL EVALUATION / 2026</p><h1>Six models.<br/><em>Matched seeds.</em></h1><div className="intro-copy"><p>A controlled visual study of how successive LoRA training strategies move Krea 2 toward a Swiss poster language.</p><div className="counter"><strong>120</strong><span>outputs</span></div><div className="counter"><strong>428</strong><span>V4 training images</span></div></div></section>
    <section className="workspace" id="compare">
      <div className="controls"><div className="prompt-tabs" role="tablist" aria-label="Prompt">{prompts.map((prompt,i)=><button key={prompt} className={activePrompt===i?'active':''} onClick={()=>setActivePrompt(i)}><small>0{i+1}</small>{prompt}</button>)}</div><div className="view-toggle"><button className={mode==='rows'?'active':''} onClick={()=>setMode('rows')} aria-label="Rows"><Rows3 size={17}/></button><button className={mode==='grid'?'active':''} onClick={()=>setMode('grid')} aria-label="Grid"><Grid3X3 size={17}/></button></div></div>
      <div className="model-filter"><span>SHOW MODELS</span>{models.map(model=><button key={model.folder} className={visibleModels.includes(model.folder)?'selected':''} onClick={()=>toggle(model.folder)}><i>{visibleModels.includes(model.folder)&&<Check size={11}/>}</i>{model.label}<small>{model.note}</small></button>)}</div>
      <div className={`comparison ${mode}`} style={{'--columns':selected.length} as React.CSSProperties}><div className="model-heads"><span>SEED</span>{selected.map(m=><div key={m.folder}><b>{m.label}</b><small>{m.note}</small></div>)}</div>{[0,1,2,3].map(seed=><div className="seed-row" key={seed}><div className="seed-label"><span>0{seed}</span><small>seed</small></div>{selected.map(model=><figure key={model.folder}><a href={`/models/${model.folder}/prompt_${activePrompt}_seed_${seed}.jpg`} target="_blank"><img src={`/models/${model.folder}/prompt_${activePrompt}_seed_${seed}.jpg`} alt={`${prompts[activePrompt]}, ${model.label}, seed ${seed}`}/></a><figcaption><b>{model.label}</b><span>Seed {seed}</span></figcaption></figure>)}</div>)}</div>
    </section>
    <section className="method" id="method"><div><p className="eyebrow">V4 TRAINING STRATEGY</p><h2>Scale the system.<br/>Keep the signal.</h2></div><div className="spec-grid">{[['428','reviewed images'],['1,200','optimization steps'],['1e-4','learning rate'],['32 / 32','LoRA rank / alpha'],['768 px','center crop'],['4','effective batch']].map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><p className="method-copy">V4 combines 370 images accepted in a human pass/fail review with the original 58-image set. Every image has a content-aware caption beginning with <code>swissposter style</code>. The final run used a stable square preprocessing path after aspect-ratio bucketing produced non-finite gradients during two discarded attempts.</p></section>
    <section className="training" id="training"><div className="section-head"><div><p className="eyebrow">SOURCE MATERIAL</p><h2>The original training set</h2></div><p>The 58 original images are shown here. V4 expands this foundation with 370 additional human-approved references, for 428 captioned training images total.</p></div><div className="training-grid">{trainingFiles.map((file,i)=><figure key={file}><a href={`/training/${file}`} target="_blank"><img src={`/training/${file}`} alt={`Training image ${i+1}`} loading="lazy"/></a><figcaption><span>{String(i+1).padStart(3,'0')}</span><a href="/captions.csv" download>caption <ChevronDown size={12}/></a></figcaption></figure>)}</div></section>
    <footer><b>K2 / SWISS POSTER STUDY</b><span>Base + five LoRA experiments</span><a href="#top">Back to top ↑</a></footer>
  </main>;
}
