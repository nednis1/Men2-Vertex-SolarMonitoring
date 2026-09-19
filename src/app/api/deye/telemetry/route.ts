import { NextResponse } from 'next/server';
import { accountManager } from '@/lib/account-manager';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceSn = searchParams.get('device_sn') || undefined;
  const accountId = searchParams.get('accountId') || undefined;

  try {
    const client = accountManager.getClient(accountId);
    const result = await client.getInverterTelemetry(deviceSn);
    return NextResponse.json({
      ...result,
      accountId: client.accountId,
      accountName: client.accountName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve inverter telemetry', details: String(error) },
      { status: 500 }
    );
  }
}
