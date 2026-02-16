import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/apps - List all apps
export async function GET() {
  try {
    console.log('GET /api/apps - Starting...');
    
    const apps = await db.app.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { records: true }
        }
      }
    });

    console.log(`GET /api/apps - Found ${apps.length} apps`);

    return NextResponse.json({
      apps: apps.map(app => ({
        ...app,
        recordCount: app._count.records
      }))
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to fetch apps', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/apps - Create new app
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/apps - Starting...');
    
    const body = await request.json();
    const { name, description, icon, iconColor, schema } = body;

    console.log('POST /api/apps - Request body:', { name, description, icon, iconColor });

    if (!name) {
      return NextResponse.json(
        { error: 'App name is required' },
        { status: 400 }
      );
    }

    const app = await db.app.create({
      data: {
        name,
        description: description || '',
        icon: icon || '📱',
        iconColor: iconColor || '#3B82F6',
        schema: schema || JSON.stringify({
          fields: [],
          views: [{ id: 'default', name: 'All Records', type: 'cards', fields: [] }],
          settings: { primaryColor: '#3B82F6' }
        }),
        published: false,
      }
    });

    console.log('POST /api/apps - Created app:', app.id);

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    console.error('Error creating app:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to create app', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
