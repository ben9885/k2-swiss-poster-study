import { NextResponse } from 'next/server';
import { generatorFetch } from '@/lib/generator-api';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, context: { params: Promise<{ jobId: string; version: string }> }) {
  try {
    const { jobId, version } = await context.params;
    if (!/^[a-f0-9]{32}$/.test(jobId) || !/^(base|v[0-6])$/.test(version)) return NextResponse.json({ error: 'Invalid image.' }, { status: 400 });
    const response = await generatorFetch(`/jobs/${jobId}/images/${version}`);
    if (!response.ok) return NextResponse.json({ error: 'Image not found.' }, { status: response.status });
    return new NextResponse(response.body, { status: 200, headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'GENERATOR_NOT_CONFIGURED' ? 503 : 502;
    return NextResponse.json({ error: 'The generated image is temporarily unavailable.' }, { status });
  }
}
