import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/integrations/google-sheets/sync - Sync data with Google Sheets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, action } = body;

    // Get the data source configuration
    const dataSource = await db.dataSource.findFirst({
      where: { appId, type: 'google_sheets' },
    });

    if (!dataSource) {
      return NextResponse.json({ error: 'No Google Sheets connection found' }, { status: 404 });
    }

    const config = JSON.parse(dataSource.config);
    const { spreadsheetId, sheetName, accessToken } = config;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated with Google' }, { status: 401 });
    }

    if (action === 'push') {
      // Push local records to Google Sheets
      return await pushToSheets(appId, spreadsheetId, sheetName || 'Sheet1', accessToken);
    } else if (action === 'pull') {
      // Pull data from Google Sheets
      return await pullFromSheets(appId, spreadsheetId, sheetName || 'Sheet1', accessToken);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Push local records to Google Sheets
async function pushToSheets(
  appId: string,
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
) {
  // Get app schema and records
  const app = await db.app.findUnique({
    where: { id: appId },
    include: {
      records: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const schema = JSON.parse(app.schema);
  const fields = schema.fields || [];

  // Prepare header row
  const headers = fields.map((f: { label: string }) => f.label);
  headers.unshift('ID', 'Created At', 'Updated At');

  // Prepare data rows
  const rows = app.records.map(record => {
    const data = JSON.parse(record.data);
    const row = [record.id, record.createdAt, record.updatedAt];
    fields.forEach((field: { id: string }) => {
      row.push(String(data[field.id] || ''));
    });
    return row;
  });

  // Build the values array (header + data)
  const values = [headers, ...rows];

  // Update Google Sheet
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=RAW&insertDataOption=OVERWRITE`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Google Sheets API error:', error);
    return NextResponse.json({ error: 'Failed to push to Google Sheets' }, { status: 500 });
  }

  // Update last sync time
  await db.dataSource.update({
    where: { id: (await db.dataSource.findFirst({ where: { appId, type: 'google_sheets' } }))?.id },
    data: { lastSync: new Date() },
  });

  return NextResponse.json({
    success: true,
    message: `Pushed ${rows.length} records to Google Sheets`,
    recordCount: rows.length,
  });
}

// Pull data from Google Sheets
async function pullFromSheets(
  appId: string,
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
) {
  // Get app schema
  const app = await db.app.findUnique({
    where: { id: appId },
  });

  if (!app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const schema = JSON.parse(app.schema);
  const fields = schema.fields || [];

  // Fetch data from Google Sheets
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Google Sheets API error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Google Sheets' }, { status: 500 });
  }

  const data = await response.json();
  const values = data.values || [];

  if (values.length < 2) {
    return NextResponse.json({
      success: true,
      message: 'No data to import',
      recordCount: 0,
    });
  }

  // Parse header row
  const headers = values[0] as string[];
  const fieldIdMap = new Map<string, number>();

  // Map headers to field IDs
  fields.forEach((field: { id: string; label: string }) => {
    const index = headers.findIndex(h => h.toLowerCase() === field.label.toLowerCase());
    if (index !== -1) {
      fieldIdMap.set(field.id, index);
    }
  });

  // Process data rows
  let imported = 0;
  for (let i = 1; i < values.length; i++) {
    const row = values[i] as string[];
    if (!row || row.length === 0) continue;

    // Build record data
    const recordData: Record<string, unknown> = {};
    fieldIdMap.forEach((index, fieldId) => {
      recordData[fieldId] = row[index] || '';
    });

    // Check if record exists (by ID if present)
    const recordId = row[0] || null;
    if (recordId) {
      const existing = await db.record.findUnique({
        where: { id: recordId },
      });

      if (existing) {
        // Update existing record
        await db.record.update({
          where: { id: recordId },
          data: { data: JSON.stringify(recordData) },
        });
        imported++;
        continue;
      }
    }

    // Create new record
    await db.record.create({
      data: {
        appId,
        data: JSON.stringify(recordData),
      },
    });
    imported++;
  }

  // Update last sync time
  const dataSource = await db.dataSource.findFirst({
    where: { appId, type: 'google_sheets' },
  });

  if (dataSource) {
    await db.dataSource.update({
      where: { id: dataSource.id },
      data: { lastSync: new Date() },
    });
  }

  return NextResponse.json({
    success: true,
    message: `Imported ${imported} records from Google Sheets`,
    recordCount: imported,
  });
}
