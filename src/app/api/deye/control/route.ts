import { NextResponse } from 'next/server';
import { accountManager } from '@/lib/account-manager';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deviceSn, mode, gridCharge, accountId } = body;

    if (!mode) {
      return NextResponse.json(
        { error: 'Field "mode" is required (e.g. PEAK_SHAVING, BATTERY_FIRST, LOAD_FIRST)' },
        { status: 400 }
      );
    }

    const client = accountManager.getClient(accountId);
    const result = await client.setWorkMode({
      deviceSn,
      mode,
      gridCharge: Boolean(gridCharge),
    });

    return NextResponse.json({
      ...result,
      accountId: client.accountId,
      accountName: client.accountName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to dispatch workmode control command', details: String(error) },
      { status: 500 }
    );
  }
}
