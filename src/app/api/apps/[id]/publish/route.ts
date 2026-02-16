import { NextRequest, NextResponse } from 'next/server';

// POST /api/apps/[id]/publish - Toggle publish status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { db } = await import('@/lib/db');

    // Get current app
    const app = await db.app.findUnique({
      where: { id },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Toggle published status
    const updatedApp = await db.app.update({
      where: { id },
      data: { published: !app.published },
    });

    return NextResponse.json({
      app: updatedApp,
      message: updatedApp.published ? 'App published successfully' : 'App unpublished',
    });
  } catch (error) {
    console.error('Error publishing app:', error);
    return NextResponse.json({ 
      error: 'Failed to publish app',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
