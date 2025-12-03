import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/drizzle/schema';
import { getCurrentOrganizationId } from '@/lib/session';
import { eq } from 'drizzle-orm';

// GET /api/customers - Get all customers for current organization
export async function GET() {
  try {
    const organizationId = await getCurrentOrganizationId();

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const customersList = await db.query.customers.findMany({
      where: eq(customers.organizationId, organizationId),
      orderBy: (customers, { desc }) => [desc(customers.createdAt)],
    });

    return NextResponse.json(customersList);
  } catch (error) {
    console.error('[GET /api/customers]', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
