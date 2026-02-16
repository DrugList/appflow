import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Google Sheets OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google-sheets/callback';

// GET /api/integrations/google-sheets/auth - Get OAuth URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');

  if (!appId) {
    return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
  }

  // Generate OAuth URL
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
  ];

  const state = Buffer.from(JSON.stringify({ appId })).toString('base64');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: authUrl.toString() });
}

// POST /api/integrations/google-sheets - Save connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, spreadsheetId, sheetName, accessToken, refreshToken } = body;

    if (!appId || !spreadsheetId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if data source already exists for this app
    const existing = await db.dataSource.findFirst({
      where: { appId, type: 'google_sheets' },
    });

    let dataSource;
    if (existing) {
      // Update existing
      dataSource = await db.dataSource.update({
        where: { id: existing.id },
        data: {
          config: JSON.stringify({
            spreadsheetId,
            sheetName,
            accessToken,
            refreshToken,
          }),
          lastSync: new Date(),
        },
      });
    } else {
      // Create new
      dataSource = await db.dataSource.create({
        data: {
          name: 'Google Sheets',
          type: 'google_sheets',
          config: JSON.stringify({
            spreadsheetId,
            sheetName,
            accessToken,
            refreshToken,
          }),
          appId,
        },
      });
    }

    return NextResponse.json({ dataSource });
  } catch (error) {
    console.error('Error saving Google Sheets connection:', error);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }
}

// DELETE /api/integrations/google-sheets - Remove connection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    await db.dataSource.deleteMany({
      where: { appId, type: 'google_sheets' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing Google Sheets connection:', error);
    return NextResponse.json({ error: 'Failed to remove connection' }, { status: 500 });
  }
}
