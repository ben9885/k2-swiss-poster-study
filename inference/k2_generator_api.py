import asyncio
import os
import secrets
import shutil
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import torch
from diffusers import Krea2Pipeline
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator


Version = Literal["base", "v0", "v1", "v2", "v3", "v4", "v5", "v6"]
MODEL_ORDER: list[Version] = ["base", "v0", "v1", "v2", "v3", "v4", "v5", "v6"]
ADAPTERS: dict[Version, str] = {
    "v0": "/home/ubuntu/k2-explorer-v0",
    "v1": "/home/ubuntu/k2-explorer-v1",
    "v2": "/home/ubuntu/k2-explorer-v2",
    "v3": "/home/ubuntu/k2-explorer-v3-captioned",
    "v4": "/home/ubuntu/k2-swiss-poster-v4-square",
    "v5": "/home/ubuntu/k2-swiss-poster-v5",
    "v6": "/home/ubuntu/k2-swiss-poster-v6",
}
OUTPUT_ROOT = Path(os.environ.get("K2_OUTPUT_ROOT", "/home/ubuntu/k2-generator-output"))
API_KEY = os.environ.get("K2_GENERATOR_API_KEY", "")
MAX_QUEUED_JOBS = 3
MAX_JOBS_PER_CLIENT_PER_HOUR = 6
JOB_TTL_SECONDS = 24 * 60 * 60

pipe: Krea2Pipeline | None = None
jobs: dict[str, dict] = {}
request_times: defaultdict[str, deque[float]] = defaultdict(deque)
job_queue: asyncio.Queue[str] = asyncio.Queue(maxsize=MAX_QUEUED_JOBS)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=600)
    versions: list[Version] = Field(default_factory=lambda: MODEL_ORDER.copy())
    seed: int = Field(default=42, ge=0, le=2_147_483_647)
    lora_scale: float = Field(default=1.0, ge=0.0, le=1.5)

    @field_validator("prompt")
    @classmethod
    def clean_prompt(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("versions")
    @classmethod
    def unique_versions(cls, value: list[Version]) -> list[Version]:
        if not value:
            raise ValueError("Select at least one model version")
        selected = set(value)
        return [version for version in MODEL_ORDER if version in selected]


def authorize(authorization: str = Header(default="")) -> None:
    expected = f"Bearer {API_KEY}"
    if not API_KEY or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


def effective_prompt(version: Version, prompt: str) -> str:
    if version == "base":
        return prompt
    if version in {"v0", "v1", "v2"}:
        return f"experimental brand exploration image, {prompt}"
    return f"swissposter style, experimental brand exploration image, {prompt}"


def public_job(job: dict) -> dict:
    return {
        "id": job["id"],
        "status": job["status"],
        "prompt": job["prompt"],
        "versions": job["versions"],
        "seed": job["seed"],
        "loraScale": job["lora_scale"],
        "completed": job["completed"],
        "total": len(job["versions"]),
        "currentVersion": job.get("current_version"),
        "outputs": job["outputs"],
        "effectivePrompts": job["effective_prompts"],
        "error": job.get("error"),
    }


def generate_job(job_id: str) -> None:
    global pipe
    if pipe is None:
        raise RuntimeError("Pipeline is not loaded")

    job = jobs[job_id]
    output_dir = OUTPUT_ROOT / job_id
    output_dir.mkdir(parents=True, exist_ok=True)
    job["status"] = "running"
    job["started_at"] = time.time()

    try:
        for version in job["versions"]:
            job["current_version"] = version
            prompt = effective_prompt(version, job["prompt"])
            job["effective_prompts"][version] = prompt

            if version == "base":
                pipe.disable_lora()
            else:
                pipe.enable_lora()
                pipe.set_adapters(version, adapter_weights=job["lora_scale"])

            generator = torch.Generator("cuda").manual_seed(job["seed"])
            with torch.inference_mode():
                image = pipe(
                    prompt,
                    height=1024,
                    width=1024,
                    num_inference_steps=8,
                    guidance_scale=0.0,
                    generator=generator,
                ).images[0]

            image_path = output_dir / f"{version}.jpg"
            image.save(image_path, quality=94, optimize=True, progressive=True)
            job["outputs"][version] = f"/api/generate/{job_id}/{version}"
            job["completed"] += 1

        job["status"] = "complete"
        job["current_version"] = None
        job["finished_at"] = time.time()
    except Exception as exc:
        job["status"] = "failed"
        job["current_version"] = None
        job["error"] = f"{type(exc).__name__}: {exc}"
        job["finished_at"] = time.time()
        torch.cuda.empty_cache()


async def worker() -> None:
    while True:
        job_id = await job_queue.get()
        try:
            await asyncio.to_thread(generate_job, job_id)
        finally:
            job_queue.task_done()


async def cleanup() -> None:
    while True:
        await asyncio.sleep(60 * 60)
        cutoff = time.time() - JOB_TTL_SECONDS
        expired = [job_id for job_id, job in jobs.items() if job["created_at"] < cutoff]
        for job_id in expired:
            jobs.pop(job_id, None)
            shutil.rmtree(OUTPUT_ROOT / job_id, ignore_errors=True)


def load_pipeline() -> Krea2Pipeline:
    loaded = Krea2Pipeline.from_pretrained(
        "krea/Krea-2-Turbo",
        torch_dtype=torch.bfloat16,
    ).to("cuda")
    for version, path in ADAPTERS.items():
        loaded.load_lora_weights(path, adapter_name=version)
    loaded.disable_lora()
    return loaded


@asynccontextmanager
async def lifespan(_: FastAPI):
    global pipe
    if not API_KEY:
        raise RuntimeError("K2_GENERATOR_API_KEY must be configured")
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    pipe = load_pipeline()
    worker_task = asyncio.create_task(worker())
    cleanup_task = asyncio.create_task(cleanup())
    yield
    worker_task.cancel()
    cleanup_task.cancel()


app = FastAPI(title="K2 Model Lab", version="1.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict:
    return {
        "ready": pipe is not None,
        "models": MODEL_ORDER,
        "queued": job_queue.qsize(),
        "active": sum(job["status"] == "running" for job in jobs.values()),
    }


@app.post("/jobs", dependencies=[Depends(authorize)], status_code=202)
async def create_job(payload: GenerateRequest, x_client_id: str = Header(default="anonymous")) -> dict:
    now = time.time()
    client_window = request_times[x_client_id]
    while client_window and client_window[0] < now - 3600:
        client_window.popleft()
    if len(client_window) >= MAX_JOBS_PER_CLIENT_PER_HOUR:
        raise HTTPException(status_code=429, detail="Generation limit reached. Try again later.")
    if job_queue.full():
        raise HTTPException(status_code=503, detail="The generator queue is full. Try again shortly.")

    client_window.append(now)
    job_id = uuid.uuid4().hex
    jobs[job_id] = {
        "id": job_id,
        "status": "queued",
        "prompt": payload.prompt,
        "versions": payload.versions,
        "seed": payload.seed,
        "lora_scale": payload.lora_scale,
        "completed": 0,
        "outputs": {},
        "effective_prompts": {},
        "created_at": now,
    }
    await job_queue.put(job_id)
    return public_job(jobs[job_id])


@app.get("/jobs/{job_id}", dependencies=[Depends(authorize)])
async def get_job(job_id: str) -> dict:
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return public_job(job)


@app.get("/jobs/{job_id}/images/{version}", dependencies=[Depends(authorize)])
async def get_image(job_id: str, version: Version) -> FileResponse:
    job = jobs.get(job_id)
    if job is None or version not in job["outputs"]:
        raise HTTPException(status_code=404, detail="Image not found")
    image_path = OUTPUT_ROOT / job_id / f"{version}.jpg"
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image_path, media_type="image/jpeg", filename=f"{job_id}-{version}.jpg")
