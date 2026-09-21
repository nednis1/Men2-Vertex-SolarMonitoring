import { NextResponse } from 'next/server';
import { accountManager } from '@/lib/account-manager';
import { DeyeAccountConfig, PlantInfo } from '@/lib/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');

  try {
    const rawAccounts: DeyeAccountConfig[] = accountManager.getAllRawAccounts();

    if (accountId) {
      const target = rawAccounts.find((a) => a.id === accountId);
      return NextResponse.json({
        accountId,
        plants: target?.plants || [],
        total: target?.plants?.length || 0,
      });
    }

    const allPlants = rawAccounts.flatMap((a: DeyeAccountConfig) =>
      (a.plants || []).map((p: PlantInfo) => ({
        ...p,
        accountId: a.id,
        accountName: a.name,
      }))
    );

    return NextResponse.json({
      total: allPlants.length,
      plants: allPlants,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve plants', details: String(error) },
      { status: 500 }
    );
  }
}

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
