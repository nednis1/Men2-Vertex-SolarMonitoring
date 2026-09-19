import { NextResponse } from 'next/server';
import { accountManager } from '@/lib/account-manager';

export async function GET() {
  try {
    const aggregate = await accountManager.getAggregatedFleetSummary();
    return NextResponse.json(aggregate);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to aggregate fleet telemetry', details: String(error) },
      { status: 500 }
    );
  }
}
