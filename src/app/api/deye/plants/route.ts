import { NextResponse } from 'next/server';
import { accountManager } from '@/lib/account-manager';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accountId, plant } = body;

    if (!accountId || !plant || !plant.stationId || !plant.stationName) {
      return NextResponse.json(
        { error: 'Fields "accountId" and "plant" with "stationId" & "stationName" are required' },
        { status: 400 }
      );
    }

    const result = await accountManager.addPlant(accountId, plant);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add plant', details: String(error) },
      { status: 500 }
    );
  }
}
