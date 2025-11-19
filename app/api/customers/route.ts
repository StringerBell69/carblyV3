import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/drizzle/schema';

// GET /api/customers - Get all customers
export async function GET() {
  try {
    const customersList = await db.query.customers.findMany({
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
