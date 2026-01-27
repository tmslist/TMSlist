import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

export const GET: APIRoute = async () => {
    try {
        const submissionsPath = path.join(process.cwd(), 'src/data/submissions.json');

        let submissions = [];
        try {
            const data = await fs.readFile(submissionsPath, 'utf-8');
            submissions = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, return empty array
            submissions = [];
        }

        return new Response(
            JSON.stringify(submissions),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch submissions' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
