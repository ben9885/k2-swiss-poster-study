import { createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generatorFetch } from '@/lib/generator-api';

export const dynamic = 'force-dynamic';

const versionSet = new Set(['base', 'v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6']);

function clientId(request: NextRequest) {
  const forwarded = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'anonymous';
  const secret = process.env.GENERATOR_API_KEY || 'unconfigured';
  return createHmac('sha256', secret).update(forwarded.split(',')[0].trim()).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim().replace(/\s+/g, ' ') : '';
    const seed = Number.isInteger(body.seed) ? body.seed : 42;
    const versions = Array.isArray(body.versions) ? [...new Set(body.versions.filter((item: unknown) => typeof item === 'string' && versionSet.has(item)))] : [];

    if (prompt.length < 3 || prompt.length > 600 || seed < 0 || seed > 2_147_483_647 || versions.length === 0) {
      return NextResponse.json({ error: 'Enter a prompt between 3 and 600 characters.' }, { status: 400 });
    }

    const response = await generatorFetch('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': clientId(request) },
      body: JSON.stringify({ prompt, seed, versions }),
    });
    return new NextResponse(response.body, { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'GENERATOR_NOT_CONFIGURED' ? 503 : 502;
    return NextResponse.json({ error: status === 503 ? 'The generator is being configured. Try again shortly.' : 'The GPU generator is temporarily unavailable.' }, { status });
  }
}
