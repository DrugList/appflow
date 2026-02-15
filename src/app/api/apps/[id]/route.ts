import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/apps/[id] - Get a single app
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = await db.app.findUnique({
      where: { id },
      include: {
        _count: {
          select: { records: true }
        }
      }
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({
      app: {
        ...app,
        recordCount: app._count.records
      }
    });
  } catch (error) {
    console.error('Error fetching app:', error);
    return NextResponse.json({ error: 'Failed to fetch app' }, { status: 500 });
  }
}

// PUT /api/apps/[id] - Update an app
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, iconColor, schema, settings, published } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (iconColor !== undefined) updateData.iconColor = iconColor;
    if (schema !== undefined) updateData.schema = typeof schema === 'string' ? schema : JSON.stringify(schema);
    if (settings !== undefined) updateData.settings = typeof settings === 'string' ? settings : JSON.stringify(settings);
    if (published !== undefined) updateData.published = published;

    const app = await db.app.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ app });
  } catch (error) {
    console.error('Error updating app:', error);
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
  }
}

// DELETE /api/apps/[id] - Delete an app
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete all records first (cascade)
    await db.record.deleteMany({
      where: { appId: id }
    });

    // Delete the app
    await db.app.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting app:', error);
    return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
  }
}
