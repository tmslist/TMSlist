import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

const reviewsPath = path.join(process.cwd(), 'src/data/reviews.json');

export const GET: APIRoute = async ({ url }) => {
    try {
        let reviews = [];
        try {
            const data = await fs.readFile(reviewsPath, 'utf-8');
            reviews = JSON.parse(data);
        } catch {
            reviews = [];
        }

        // Filter by clinicId if provided
        const clinicId = url.searchParams.get('clinicId');
        if (clinicId) {
            reviews = reviews.filter((r: any) => r.clinicId === clinicId);
        }

        return new Response(
            JSON.stringify(reviews),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        let reviewData;
        try {
            const rawBody = await request.text();

            // Log raw body for debugging
            const logPath = path.join(process.cwd(), 'src/data/debug_log.txt');
            try { await fs.appendFile(logPath, `[${new Date().toISOString()}] REV POST Raw: ${rawBody}\n`); } catch (e) { }

            if (!rawBody) {
                throw new Error('Empty request body');
            }
            reviewData = JSON.parse(rawBody);
        } catch (e: any) {
            throw new Error(`Invalid JSON body: ${e.message}`);
        }

        // Validate
        if (!reviewData.clinicId || !reviewData.rating) {
            return new Response(JSON.stringify({ success: false, message: "Missing required fields (clinicId or rating)" }), { status: 400 });
        }

        let reviews = [];
        try {
            const data = await fs.readFile(reviewsPath, 'utf-8');
            reviews = JSON.parse(data);
        } catch {
            reviews = [];
        }

        const newReview = {
            id: `review-${Date.now()}`,
            userId: reviewData.userId || `guest-${Date.now()}`,
            ...reviewData,
            createdAt: new Date().toISOString(),
            verified: false // pending moderation
        };

        reviews.push(newReview);
        await fs.writeFile(reviewsPath, JSON.stringify(reviews, null, 2), 'utf-8');

        return new Response(JSON.stringify({ success: true, review: newReview }), { status: 200 });
    } catch (error: any) {
        const logPath = path.join(process.cwd(), 'src/data/debug_log.txt');
        const timestamp = new Date().toISOString();
        // Since we can't await inside the catch immediately for fs/promises without being async, 
        // but this is an async function, it's fine.
        // Also handling 'fs' import potentially not having writeFile if imported as 'fs/promises'
        // But we imported 'fs' from 'fs/promises'. 
        // Let's use a try-catch for the log write itself so we don't crash the crash handler.
        try {
            await fs.appendFile(logPath, `[${timestamp}] REV POST Error: ${error?.message || error}\n${error?.stack || ''}\n\n`);
        } catch (e) { /* ignore log error */ }

        console.error(error);
        return new Response(JSON.stringify({ success: false, error: error?.message }), { status: 500 });
    }
};
