import { NextRequest, NextResponse } from 'next/server';

// POST /api/integrations/rest-api - Connect REST API
export async function POST(request: NextRequest) {
  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { appId, url, apiKey } = body;

    if (!appId || !url) {
      return NextResponse.json({ error: 'App ID and URL are required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check if data source already exists for this app
    const existing = await db.dataSource.findFirst({
      where: { appId, type: 'rest_api' },
    });

    let dataSource;
    if (existing) {
      // Update existing
      dataSource = await db.dataSource.update({
        where: { id: existing.id },
        data: {
          config: JSON.stringify({
            url,
            apiKey: apiKey || null,
          }),
          lastSync: new Date(),
        },
      });
    } else {
      // Create new
      dataSource = await db.dataSource.create({
        data: {
          name: 'REST API',
          type: 'rest_api',
          config: JSON.stringify({
            url,
            apiKey: apiKey || null,
          }),
          appId,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      dataSource,
      message: 'REST API connected successfully' 
    });
  } catch (error) {
    console.error('Error connecting REST API:', error);
    return NextResponse.json({ 
      error: 'Failed to connect REST API',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/integrations/rest-api - Get REST API connection status
export async function GET(request: NextRequest) {
  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    const dataSource = await db.dataSource.findFirst({
      where: { appId, type: 'rest_api' },
    });

    return NextResponse.json({ 
      connected: !!dataSource,
      dataSource: dataSource ? {
        id: dataSource.id,
        name: dataSource.name,
        url: JSON.parse(dataSource.config).url,
        lastSync: dataSource.lastSync,
      } : null
    });
  } catch (error) {
    console.error('Error fetching REST API connection:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch REST API connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/integrations/rest-api - Remove REST API connection
export async function DELETE(request: NextRequest) {
  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    await db.dataSource.deleteMany({
      where: { appId, type: 'rest_api' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing REST API connection:', error);
    return NextResponse.json({ 
      error: 'Failed to remove REST API connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
