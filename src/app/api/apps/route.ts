import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint
export async function GET() {
  try {
    // Check environment variables
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
    
    console.log('Environment check:', {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
      hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
      nodeEnv: process.env.NODE_ENV,
    });

    if (!dbUrl) {
      return NextResponse.json({ 
        error: 'No database URL found',
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
          hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
        }
      }, { status: 500 });
    }

    // Dynamically import Prisma only after checking env
    const { db } = await import('@/lib/db');
    
    const apps = await db.app.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { records: true }
        }
      }
    });

    return NextResponse.json({
      apps: apps.map(app => ({
        ...app,
        recordCount: app._count.records
      }))
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch apps', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/apps - Create new app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, iconColor, schema } = body;

    console.log('Creating app:', { name, description });

    if (!name) {
      return NextResponse.json(
        { error: 'App name is required' },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db');

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

    console.log('Created app:', app.id);

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    console.error('Error creating app:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create app', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
