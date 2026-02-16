import { NextRequest, NextResponse } from 'next/server';

// POST /api/integrations/rest-api/sync - Sync data from REST API
export async function POST(request: NextRequest) {
  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { appId } = body;

    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    // Get the data source configuration
    const dataSource = await db.dataSource.findFirst({
      where: { appId, type: 'rest_api' },
    });

    if (!dataSource) {
      return NextResponse.json({ error: 'No REST API connection found' }, { status: 404 });
    }

    const config = JSON.parse(dataSource.config);
    const { url, apiKey } = config;

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Fetch data from the API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json({ 
          error: `API returned status ${response.status}`,
        }, { status: 400 });
      }

      const data = await response.json();
      
      // Extract records array
      let records: unknown[] = [];
      if (Array.isArray(data)) {
        records = data;
      } else if (Array.isArray(data.data)) {
        records = data.data;
      } else if (Array.isArray(data.results)) {
        records = data.results;
      } else if (typeof data === 'object' && data !== null) {
        // Single record or object with nested data
        records = [data];
      }

      // Get the app schema to map fields
      const app = await db.app.findUnique({
        where: { id: appId },
      });

      if (!app) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
      }

      // Import records into the database
      let importedCount = 0;
      const schema = JSON.parse(app.schema);
      const fieldIds = schema.fields?.map((f: { id: string }) => f.id) || [];

      for (const record of records) {
        if (typeof record === 'object' && record !== null) {
          // Map API data to record fields
          const recordData: Record<string, unknown> = {};
          const recordObj = record as Record<string, unknown>;
          
          // Try to map fields by name or id
          if (schema.fields) {
            for (const field of schema.fields) {
              const fieldLabel = field.label?.toLowerCase().replace(/\s+/g, '_');
              const fieldId = field.id;
              
              // Try different key variations
              const value = recordObj[fieldLabel] ?? 
                          recordObj[fieldId] ?? 
                          recordObj[field.name] ?? 
                          recordObj[field.label];
              
              if (value !== undefined) {
                recordData[fieldId] = value;
              }
            }
          }

          // Create the record
          await db.record.create({
            data: {
              appId,
              data: JSON.stringify(recordData),
            },
          });
          importedCount++;
        }
      }

      // Update last sync time
      await db.dataSource.update({
        where: { id: dataSource.id },
        data: { lastSync: new Date() },
      });

      return NextResponse.json({ 
        success: true,
        recordsCount: importedCount,
        message: `Successfully imported ${importedCount} records`,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return NextResponse.json({ error: 'Sync timed out' }, { status: 408 });
        }
        return NextResponse.json({ error: `Sync failed: ${fetchError.message}` }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Sync failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error syncing REST API:', error);
    return NextResponse.json({ 
      error: 'Failed to sync data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
