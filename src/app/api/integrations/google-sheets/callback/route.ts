import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google-sheets/callback';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_params', request.url)
      );
    }

    // Decode state to get appId
    const { appId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    // Get list of spreadsheets
    const driveResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet"&fields=files(id,name)',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    let spreadsheets: { id: string; name: string }[] = [];
    if (driveResponse.ok) {
      const driveData = await driveResponse.json();
      spreadsheets = driveData.files || [];
    }

    // Store the tokens temporarily (in production, use secure session)
    // Redirect to app builder with connection data
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('google_sheets_connected', 'true');
    redirectUrl.searchParams.set('appId', appId);
    redirectUrl.searchParams.set('access_token', access_token);
    if (refresh_token) {
      redirectUrl.searchParams.set('refresh_token', refresh_token);
    }
    redirectUrl.searchParams.set('spreadsheets', JSON.stringify(spreadsheets));

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=callback_failed', request.url)
    );
  }
}
