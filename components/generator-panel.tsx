'use client';

import Image from 'next/image';
import { type SyntheticEvent, useEffect, useState } from 'react';
import { Download, LoaderCircle, Sparkles } from 'lucide-react';

type Version = 'base' | 'v0' | 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6';
type JobStatus = 'queued' | 'running' | 'complete' | 'failed';

type GenerationJob = {
  id: string;
  status: JobStatus;
  prompt: string;
  versions: Version[];
  seed: number;
  completed: number;
  total: number;
  currentVersion: Version | null;
  outputs: Partial<Record<Version, string>>;
  error?: string | null;
};

const versions: { id: Version; label: string }[] = [
  { id: 'base', label: 'Base' },
  { id: 'v0', label: 'V0' },
  { id: 'v1', label: 'V1' },
  { id: 'v2', label: 'V2' },
  { id: 'v3', label: 'V3' },
  { id: 'v4', label: 'V4' },
  { id: 'v5', label: 'V5' },
  { id: 'v6', label: 'V6' },
];

async function readResponse(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || body?.detail || 'The generator could not complete this request.');
  }
  return body as GenerationJob;
}

export function GeneratorPanel() {
  const [prompt, setPrompt] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<Version[]>(['base', 'v3', 'v6']);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const active = submitting || job?.status === 'queued' || job?.status === 'running';
  const jobId = job?.id;
  const jobStatus = job?.status;

  function toggleVersion(version: Version) {
    if (active) return;
    setSelectedVersions((current) => {
      if (current.includes(version)) {
        return current.length === 1 ? current : current.filter((item) => item !== version);
      }
      return versions.map(({ id }) => id).filter((item) => item === version || current.includes(item));
    });
  }

  useEffect(() => {
    if (!jobId || jobStatus === 'complete' || jobStatus === 'failed') return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const response = await fetch(`/api/generate/${jobId}`, { cache: 'no-store' });
        const nextJob = await readResponse(response);
        if (!cancelled) {
          setJob(nextJob);
          if (nextJob.status !== 'complete' && nextJob.status !== 'failed') {
            timeout = setTimeout(poll, 1800);
          }
        }
      } catch (pollError) {
        if (!cancelled) {
          setError(pollError instanceof Error ? pollError.message : 'The generator connection was interrupted.');
        }
      }
    };

    timeout = setTimeout(poll, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [jobId, jobStatus]);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = prompt.trim();
    if (cleaned.length < 3 || active) return;
    const fullPrompt = `a swiss poster ${cleaned}`;

    setSubmitting(true);
    setError('');
    setJob(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, seed: 42, versions: selectedVersions }),
      });
      setJob(await readResponse(response));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The generator could not be started.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hero-generator" id="generate">
      <form className="generator-form" onSubmit={submit}>
        <label htmlFor="generation-prompt">Generate across Base + V0–V6</label>
        <div className="generator-input-row">
          <div className="generator-prompt-field">
            <span id="generation-prompt-prefix">a swiss poster</span>
            <textarea
              id="generation-prompt"
              aria-describedby="generation-prompt-prefix"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="for a brand, product, audience, and desired visual tension…"
              rows={2}
              minLength={3}
              maxLength={580}
              disabled={active}
            />
          </div>
          <button type="submit" disabled={active || prompt.trim().length < 3}>
            {active ? <LoaderCircle className="generator-spinner" size={18} /> : <Sparkles size={18} />}
            {submitting ? 'Starting' : active ? `${job?.completed ?? 0} / ${job?.total ?? selectedVersions.length} generated` : `Generate ${selectedVersions.length} ${selectedVersions.length === 1 ? 'image' : 'images'}`}
          </button>
        </div>
        <div className="generator-models" aria-label="Models to generate">
          <span>Models</span>
          {versions.map(({ id, label }) => <button type="button" key={id} aria-pressed={selectedVersions.includes(id)} disabled={active} onClick={() => toggleVersion(id)}>{label}</button>)}
        </div>
        <div className="generator-meta">
          <span>{selectedVersions.length} MATCHED {selectedVersions.length === 1 ? 'OUTPUT' : 'OUTPUTS'}</span><span>SEED 42</span><span>1024 × 1024</span><span>8 STEPS</span><span>GUIDANCE 0</span>
        </div>
      </form>

      {error && <div className="generator-error" role="alert">{error}</div>}
      {job && (
        <div className="generator-results" aria-live="polite">
          <div className="generator-status">
            <span>{job.status === 'complete' ? 'Generation complete' : job.status === 'failed' ? 'Generation failed' : 'Generating matched outputs'}</span>
            <b>{job.completed} / {job.total}</b>
          </div>
          <div className="generator-progress"><i style={{ width: `${(job.completed / job.total) * 100}%` }} /></div>
          <div className="generator-grid">
            {versions.filter(({ id }) => job.versions.includes(id)).map(({ id, label }) => {
              const source = job.outputs[id];
              const isCurrent = job.currentVersion === id;
              return (
                <figure key={id} className={source ? 'ready' : isCurrent ? 'generating' : ''}>
                  <div className="generator-image">
                    {source ? <Image src={source} alt={`${label} generation for ${job.prompt}`} width={1024} height={1024} unoptimized /> : <span>{isCurrent ? 'Generating' : 'Queued'}</span>}
                  </div>
                  <figcaption><b>{label}</b>{source && <a href={source} download={`${label}-${job.id}.jpg`} aria-label={`Download ${label}`}><Download size={13} /></a>}</figcaption>
                </figure>
              );
            })}
          </div>
          {job.error && <div className="generator-error" role="alert">{job.error}</div>}
        </div>
      )}
    </div>
  );
}
