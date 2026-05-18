import type { APIRoute } from 'astro';
import { transcribeLhwSpeechNotes } from '../../../services/openrouter';
import { verifySession } from '../../../lib/session';

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('maternalink_session')?.value;
  const user = sessionCookie ? verifySession(sessionCookie) : null;

  if (!user || user.role !== 'LHW') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { text } = await request.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    const result = await transcribeLhwSpeechNotes(text);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("Transcription endpoint error:", err);
    return new Response(JSON.stringify({ error: 'Failed to parse text' }), { status: 500 });
  }
};
