import { NextResponse } from 'next/server';
import { deyeClient } from '@/lib/deye-client';

export async function GET() {
  try {
    const points = deyeClient.getHourlyEnergy();
    return NextResponse.json({ data: points, isLive: false });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve hourly history', details: String(error) },
      { status: 500 }
    );
  }
}
