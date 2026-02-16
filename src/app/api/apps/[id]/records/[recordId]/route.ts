import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/apps/[id]/records/[recordId]/favorite - Toggle favorite status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: appId, recordId } = await params;

    // Get current record
    const record = await db.record.findFirst({
      where: { id: recordId, appId },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Toggle favorite status
    const updatedRecord = await db.record.update({
      where: { id: recordId },
      data: { isFavorite: !record.isFavorite },
    });

    return NextResponse.json({
      record: {
        id: updatedRecord.id,
        appId: updatedRecord.appId,
        data: JSON.parse(updatedRecord.data),
        isFavorite: updatedRecord.isFavorite,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}

// DELETE /api/apps/[id]/records/[recordId] - Delete a record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: appId, recordId } = await params;

    // Delete the record
    await db.record.delete({
      where: { id: recordId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        appId,
        recordId,
        action: 'delete',
        changes: JSON.stringify({}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}

// PUT /api/apps/[id]/records/[recordId] - Update a record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: appId, recordId } = await params;
    const body = await request.json();
    const { data } = body;

    // Get current record
    const record = await db.record.findFirst({
      where: { id: recordId, appId },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Update record
    const updatedRecord = await db.record.update({
      where: { id: recordId },
      data: {
        data: JSON.stringify(data),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        appId,
        recordId,
        action: 'update',
        changes: JSON.stringify(data),
      },
    });

    return NextResponse.json({
      record: {
        id: updatedRecord.id,
        appId: updatedRecord.appId,
        data: JSON.parse(updatedRecord.data),
        isFavorite: updatedRecord.isFavorite,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}
