import { NextResponse } from 'next/server';
import { deyeClient } from '@/lib/deye-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'TODAY';
    const step = parseInt(searchParams.get('step') || '5', 10) || 5;
    const points = deyeClient.getHourlyEnergy(range, step);
    return NextResponse.json({ data: points, isLive: false, range, stepMinutes: step });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve hourly history', details: String(error) },
      { status: 500 }
    );
  }
}
