import { NextResponse } from 'next/server';
import { generatorFetch } from '@/lib/generator-api';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    if (!/^[a-f0-9]{32}$/.test(jobId)) return NextResponse.json({ error: 'Invalid job.' }, { status: 400 });
    const response = await generatorFetch(`/jobs/${jobId}`);
    return new NextResponse(response.body, { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'GENERATOR_NOT_CONFIGURED' ? 503 : 502;
    return NextResponse.json({ error: status === 503 ? 'The generator is being configured. Try again shortly.' : 'The GPU generator is temporarily unavailable.' }, { status });
  }
}
