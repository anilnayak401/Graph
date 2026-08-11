import { NextResponse } from 'next/server';
import { seedDatabase } from '@/scripts/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'CognoDB database successfully re-seeded!',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
