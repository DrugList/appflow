import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/apps/[id]/records - Get all records for an app
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const { searchParams } = new URL(request.url);
    const favorites = searchParams.get('favorites') === 'true';

    const where: { appId: string; isFavorite?: boolean } = { appId };
    if (favorites) {
      where.isFavorite = true;
    }

    const records = await db.record.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      records: records.map(r => ({
        id: r.id,
        appId: r.appId,
        data: JSON.parse(r.data),
        isFavorite: r.isFavorite,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

// POST /api/apps/[id]/records - Create a new record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const body = await request.json();
    const { data } = body;

    // Check if app exists
    const app = await db.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Create record
    const record = await db.record.create({
      data: {
        appId,
        data: JSON.stringify(data || {}),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        appId,
        recordId: record.id,
        action: 'create',
        changes: JSON.stringify(data || {}),
      },
    });

    return NextResponse.json({
      record: {
        id: record.id,
        appId: record.appId,
        data: JSON.parse(record.data),
        isFavorite: record.isFavorite,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating record:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
