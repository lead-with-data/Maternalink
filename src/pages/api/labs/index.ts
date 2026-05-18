import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { bigquery } from '../../../services/bigquery';
import crypto from 'crypto';

const datasetId = process.env.GCP_DATASET_ID || 'maternalink_analytics';
const projectId = process.env.GCP_PROJECT_ID;

// Opaque patient hashing helper
function anonymizeId(patientId: string): string {
  if (!patientId) return 'unknown';
  return crypto.createHash('sha256').update(patientId).digest('hex').substring(0, 32);
}

// Security gate check
function isAuthorized(request: Request, url: URL): boolean {
  const expectedKey = process.env.MATERNALINK_LABS_KEY || 'MATERNALINK_LABS_KEY_2026';
  const headerKey = request.headers.get('x-api-key');
  const queryKey = url.searchParams.get('apiKey');

  return headerKey === expectedKey || queryKey === expectedKey;
}

// Shared handler to process dynamic filters and retrieve de-identified data
async function getDeidentifiedData(filters: {
  minAge?: number;
  maxAge?: number;
  riskCategory?: string;
  minGestationalWeeks?: number;
  maxGestationalWeeks?: number;
  limit?: number;
}) {
  const limit = Math.min(filters.limit || 100, 1000);
  const minAge = filters.minAge || 0;
  const maxAge = filters.maxAge || 120;
  const minWeeks = filters.minGestationalWeeks || 0;
  const maxWeeks = filters.maxGestationalWeeks || 50;
  const risk = filters.riskCategory?.toUpperCase();

  // Try Google BigQuery Data Warehouse first
  if (projectId && process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
    try {
      console.log('[Labs API] Executing high-scale query in BigQuery warehouse...');
      let bqQuery = `
        SELECT 
          v.id AS visitId,
          v.patientId,
          p.age,
          v.visitDate,
          v.gestationalWeeks,
          v.systolicBP,
          v.diastolicBP,
          v.hemoglobin,
          v.weight,
          v.fetalHeartRate,
          v.symptoms,
          v.riskScore,
          v.riskCategory,
          v.medications
        FROM \`${projectId}.${datasetId}.FactVisit\` AS v
        JOIN \`${projectId}.${datasetId}.DimPatient\` AS p ON v.patientId = p.id
        WHERE p.age >= @minAge AND p.age <= @maxAge
          AND v.gestationalWeeks >= @minWeeks AND v.gestationalWeeks <= @maxWeeks
      `;

      const params: any = { minAge, maxAge, minWeeks, maxWeeks };

      if (risk) {
        bqQuery += ` AND v.riskCategory = @riskCategory`;
        params.riskCategory = risk;
      }

      bqQuery += ` ORDER BY v.visitDate DESC LIMIT @limit`;
      params.limit = limit;

      const [rows] = await bigquery.query({
        query: bqQuery,
        params,
        types: {
          minAge: 'INT64',
          maxAge: 'INT64',
          minWeeks: 'INT64',
          maxWeeks: 'INT64',
          riskCategory: 'STRING',
          limit: 'INT64',
        }
      });

      console.log(`[Labs API] BigQuery retrieved ${rows.length} records.`);

      // Cryptographically anonymize names, mobile, and specific patient IDs
      return rows.map((r: any) => {
        let parsedSymptoms = [];
        try {
          parsedSymptoms = typeof r.symptoms === 'string' ? JSON.parse(r.symptoms) : (r.symptoms || []);
        } catch (e) {
          parsedSymptoms = [];
        }

        return {
          anonymizedPatientId: anonymizeId(r.patientId),
          age: Number(r.age),
          visitDate: r.visitDate?.value || r.visitDate || null,
          gestationalWeeks: Number(r.gestationalWeeks),
          systolicBP: Number(r.systolicBP),
          diastolicBP: Number(r.diastolicBP),
          hemoglobin: Number(r.hemoglobin),
          weight: Number(r.weight),
          fetalHeartRate: r.fetalHeartRate ? Number(r.fetalHeartRate) : null,
          symptoms: parsedSymptoms,
          riskScore: Number(r.riskScore),
          riskCategory: r.riskCategory,
          medications: r.medications || null,
        };
      });

    } catch (bqErr) {
      console.warn('[Labs API] BigQuery query failed. Falling back to local PostgreSQL database...', bqErr);
    }
  }

  // Fallback: PostgreSQL database query using Prisma Client (preserving exactly the same schema)
  console.log('[Labs API] Executing transactional fallback query in PostgreSQL...');
  
  const prismaWhere: any = {
    gestationalWeeks: { gte: minWeeks, lte: maxWeeks },
    pregnancy: {
      patient: {
        age: { gte: minAge, lte: maxAge }
      }
    }
  };

  if (risk) {
    prismaWhere.riskCategory = risk;
  }

  const visits = await db.visit.findMany({
    where: prismaWhere,
    include: {
      pregnancy: {
        include: {
          patient: true
        }
      }
    },
    orderBy: { visitDate: 'desc' },
    take: limit
  });

  console.log(`[Labs API] PostgreSQL fallback retrieved ${visits.length} records.`);

  return visits.map((v: any) => {
    let parsedSymptoms = [];
    try {
      parsedSymptoms = typeof v.symptoms === 'string' ? JSON.parse(v.symptoms) : (v.symptoms || []);
    } catch (e) {
      parsedSymptoms = [];
    }

    return {
      anonymizedPatientId: anonymizeId(v.pregnancy?.patient?.id),
      age: v.pregnancy?.patient?.age || 0,
      visitDate: v.visitDate.toISOString(),
      gestationalWeeks: v.gestationalWeeks,
      systolicBP: v.systolicBP,
      diastolicBP: v.diastolicBP,
      hemoglobin: v.hemoglobin,
      weight: v.weight,
      fetalHeartRate: v.fetalHeartRate,
      symptoms: parsedSymptoms,
      riskScore: v.riskScore,
      riskCategory: v.riskCategory,
      medications: v.medications,
    };
  });
}

// GET Endpoint: Query string filter processing
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);

  if (!isAuthorized(request, url)) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Invalid or missing "x-api-key" header.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const filters = {
      minAge: url.searchParams.get('minAge') ? Number(url.searchParams.get('minAge')) : undefined,
      maxAge: url.searchParams.get('maxAge') ? Number(url.searchParams.get('maxAge')) : undefined,
      riskCategory: url.searchParams.get('riskCategory') || undefined,
      minGestationalWeeks: url.searchParams.get('minGestationalWeeks') ? Number(url.searchParams.get('minGestationalWeeks')) : undefined,
      maxGestationalWeeks: url.searchParams.get('maxGestationalWeeks') ? Number(url.searchParams.get('maxGestationalWeeks')) : undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    };

    const data = await getDeidentifiedData(filters);

    return new Response(JSON.stringify({
      success: true,
      recordsCount: data.length,
      data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });

  } catch (err: any) {
    console.error('[Labs API] GET handler crash:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST Endpoint: JSON request body filter processing
export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);

  if (!isAuthorized(request, url)) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Invalid or missing "x-api-key" header.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Allow empty bodies
    }

    const filters = {
      minAge: body.minAge !== undefined ? Number(body.minAge) : undefined,
      maxAge: body.maxAge !== undefined ? Number(body.maxAge) : undefined,
      riskCategory: body.riskCategory || undefined,
      minGestationalWeeks: body.minGestationalWeeks !== undefined ? Number(body.minGestationalWeeks) : undefined,
      maxGestationalWeeks: body.maxGestationalWeeks !== undefined ? Number(body.maxGestationalWeeks) : undefined,
      limit: body.limit !== undefined ? Number(body.limit) : undefined,
    };

    const data = await getDeidentifiedData(filters);

    return new Response(JSON.stringify({
      success: true,
      recordsCount: data.length,
      data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });

  } catch (err: any) {
    console.error('[Labs API] POST handler crash:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// OPTIONS Endpoint for CORS Support
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400'
    }
  });
};
