import { NextRequest, NextResponse } from 'next/server';

// POST /api/integrations/rest-api/test - Test REST API connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, apiKey } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Test the connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
          status: response.status,
        }, { status: 400 });
      }

      // Try to parse the response as JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return NextResponse.json({ 
          error: 'API did not return JSON data',
          contentType,
        }, { status: 400 });
      }

      const data = await response.json();
      
      // Count records if it's an array
      const recordCount = Array.isArray(data) 
        ? data.length 
        : Array.isArray(data.data) 
          ? data.data.length 
          : Array.isArray(data.results)
            ? data.results.length
            : null;

      return NextResponse.json({ 
        success: true,
        message: 'Connection successful',
        recordCount,
        sampleData: Array.isArray(data) 
          ? data.slice(0, 2) 
          : data,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return NextResponse.json({ error: 'Connection timed out' }, { status: 408 });
        }
        return NextResponse.json({ error: `Connection failed: ${fetchError.message}` }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Connection failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error testing REST API:', error);
    return NextResponse.json({ 
      error: 'Failed to test connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
