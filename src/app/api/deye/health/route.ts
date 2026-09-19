import { NextResponse } from 'next/server';
import { accountManager } from '@/lib/account-manager';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId') || undefined;

  try {
    if (accountId) {
      const client = accountManager.getClient(accountId);
      const health = await client.getHealth();
      return NextResponse.json({
        ...health,
        accountId: client.accountId,
        accountName: client.accountName,
      });
    }

    // Return primary client's health with multi-account fleet indicators
    const primaryClient = accountManager.getClient();
    const health = await primaryClient.getHealth();
    const clients = accountManager.getAllClients();

    return NextResponse.json({
      ...health,
      totalConfiguredAccounts: clients.length,
      accountId: primaryClient.accountId,
      accountName: primaryClient.accountName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to query gateway health', details: String(error) },
      { status: 500 }
    );
  }
}
