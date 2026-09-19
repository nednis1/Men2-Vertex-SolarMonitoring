import { NextResponse } from 'next/server';
import { accountManager } from '@/lib/account-manager';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Field "accountId" is required' },
        { status: 400 }
      );
    }

    const result = await accountManager.syncAccount(accountId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to sync account plants', details: String(error) },
      { status: 500 }
    );
  }
}
