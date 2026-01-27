import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

export const POST: APIRoute = async ({ request }) => {
  try {
    let formData;
    try {
      const rawBody = await request.text();
      const logPath = path.join(process.cwd(), 'src/data/debug_log.txt');
      try { await fs.appendFile(logPath, `[${new Date().toISOString()}] SUBMIT POST Raw: ${rawBody}\n`); } catch (e) { }

      if (!rawBody) throw new Error('Empty request body');
      formData = JSON.parse(rawBody);
    } catch (e: any) {
      throw new Error(`Invalid JSON body: ${e.message}`);
    }

    // Validate required fields based on submission type
    if (!formData.type || !formData.email) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create submission object with unique ID and timestamp
    const submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...formData,
      timestamp: new Date().toISOString(),
    };

    // Determine target file based on submission type
    const isLead = formData.type === 'lead-magnet';
    const targetFile = isLead ? 'leads.json' : 'submissions.json';
    const submissionsPath = path.join(process.cwd(), 'src/data', targetFile);

    // Read existing data
    let submissions = [];
    try {
      const data = await fs.readFile(submissionsPath, 'utf-8');
      submissions = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      submissions = [];
    }

    // Add new submission
    submissions.push(submission);

    // Write back to file
    await fs.writeFile(
      submissionsPath,
      JSON.stringify(submissions, null, 2),
      'utf-8'
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Submission received successfully',
        submissionId: submission.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing submission:', error);
    const logPath = path.join(process.cwd(), 'src/data/debug_log.txt');
    try {
      await fs.appendFile(logPath, `[${new Date().toISOString()}] SUBMIT Error: ${error?.message || error}\n${error?.stack || ''}\n\n`);
    } catch (e) { /* ignore */ }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'An error occurred processing your submission',
        error: error?.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
