import { NextResponse } from 'next/server';
import { accountManager } from '@/lib/account-manager';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stationId = searchParams.get('station_id') || searchParams.get('stationId') || undefined;
  const accountId = searchParams.get('accountId') || undefined;

  try {
    const client = accountManager.getClient(accountId);
    const result = await client.getStationSummary(stationId);
    return NextResponse.json({
      ...result,
      accountId: client.accountId,
      accountName: client.accountName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve station telemetry', details: String(error) },
      { status: 500 }
    );
  }
}
