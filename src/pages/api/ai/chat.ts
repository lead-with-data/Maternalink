import type { APIRoute } from 'astro';
import { askMotherHealthAssistant, askClinicalAssistant } from '../../../services/openrouter';
import { verifySession } from '../../../lib/session';
import { db } from '../../../lib/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('maternalink_session')?.value;
  const user = sessionCookie ? verifySession(sessionCookie) : null;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { message, context } = await request.json();
    if (!message) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
    }

    // Patient Scenario
    if (user.role === 'PATIENT') {
      const patient = await db.patient.findUnique({
        where: { id: user.id },
        include: {
          pregnancies: {
            include: {
              visits: {
                orderBy: { visitDate: 'desc' }
              }
            }
          }
        }
      });

      if (!patient) {
        return new Response(JSON.stringify({ error: 'Patient not found' }), { status: 404 });
      }

      const activePregnancy = patient.pregnancies.find(p => p.isActive === true);
      const visits = activePregnancy ? activePregnancy.visits : [];

      const reply = await askMotherHealthAssistant(patient, visits, message);
      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } 

    // Staff Scenario (ADMIN, NURSE, LHW)
    const reply = await askClinicalAssistant(user, message, context || user.role.toLowerCase());
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("Chatbot API endpoint error:", err);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), { status: 500 });
  }
};

