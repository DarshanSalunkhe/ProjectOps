/**
 * ProjectOps AI Service — Multi-Model Router
 *
 * Model hierarchy (all via Google AI Studio v1 API):
 *   Routine/GitHub:   gemma-4-26b-a4b-it   (AI_MODEL / AI_GITHUB_MODEL / AI_SUMMARY_MODEL)
 *   Complex/Planning: gemma-4-31b-it        (AI_REASONING_MODEL / AI_PLANNING_MODEL / AI_RISK_MODEL)
 *   Escalation:       gemini-3.1-flash-lite (AI_ESCALATION_MODEL)
 */
import crypto from 'node:crypto';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const cache = new Map(), pending = new Map();

// ── Model selection per feature ───────────────────────────────────────────────
const FEATURE_MODEL_ENV = {
  GITHUB_TASK_MATCHING:       'AI_TASK_MATCHING_MODEL',
  GITHUB_COMMIT_ANALYSIS:     'AI_GITHUB_MODEL',
  PLAN_GENERATION:            'AI_PLANNING_MODEL',
  TASK_GENERATION:            'AI_PLANNING_MODEL',
  ASSIGNMENT_RECOMMENDATION:  'AI_ASSIGNMENT_MODEL',
  RECOVERY_PROPOSAL:          'AI_REPLANNING_MODEL',
  RISK_ANALYSIS:              'AI_RISK_MODEL',
  SKILL_MATCHING:             'AI_ASSIGNMENT_MODEL',
  CHAT:                       'AI_ASSISTANT_MODEL',
};

const DEFAULT_ROUTINE  = 'gemma-4-26b-a4b-it';
const DEFAULT_COMPLEX  = 'gemma-4-31b-it';
const DEFAULT_FALLBACK = 'gemini-3.1-flash-lite';

function selectModel(feature) {
  const envKey = FEATURE_MODEL_ENV[feature];
  if (envKey && process.env[envKey]) return process.env[envKey];
  // Complex features default to reasoning model
  const complexFeatures = ['PLAN_GENERATION','TASK_GENERATION','ASSIGNMENT_RECOMMENDATION','RECOVERY_PROPOSAL','RISK_ANALYSIS','SKILL_MATCHING'];
  if (complexFeatures.includes(feature)) return process.env.AI_REASONING_MODEL || DEFAULT_COMPLEX;
  return process.env.AI_MODEL || DEFAULT_ROUTINE;
}

// ── Raw model call via Google AI Studio v1 API ────────────────────────────────
export async function requestModel(modelName, messages, opts = {}) {
  const model = modelName || process.env.AI_MODEL || DEFAULT_ROUTINE;
  const maxOutput = opts.maxOutput || 1000;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) throw new AppError('GEMINI_API_KEY is not configured', 503);

  // Use v1 endpoint (not v1beta) — required for Gemma 4 models
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  const systemParts = messages.filter(m => m.role === 'system').map(m => ({ text: m.content }));
  const userParts   = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    ...(systemParts.length ? { systemInstruction: { parts: systemParts } } : {}),
    contents: userParts,
    generationConfig: {
      maxOutputTokens: maxOutput,
      ...(opts.jsonMode ? { responseMimeType: 'application/json' } : {})
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.AI_REQUEST_TIMEOUT_MS || 30000))
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new AppError(`AI model "${model}" request failed (${response.status}): ${errBody.slice(0, 200)}`, 503);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!content.trim()) throw new AppError(`Model "${model}" returned an empty response`, 503);
  if (opts.jsonMode) JSON.parse(content); // validate JSON early

  return {
    content: content.slice(0, maxOutput * 8),
    provider: 'gemini',
    model,
    inputTokens:  data.usageMetadata?.promptTokenCount     || 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
  };
}

// ── Public service ────────────────────────────────────────────────────────────
export const aiService = {
  isAvailable() {
    return !!process.env.GEMINI_API_KEY;
  },

  invalidateProject(projectId) {
    for (const [key, item] of cache) {
      if (String(item.projectId) === String(projectId)) cache.delete(key);
    }
  },

  /**
   * Main entry point. Routes feature to the correct model, checks quotas,
   * caches results, and records usage.
   */
  async call(feature, messages, opts = {}) {
    if (!opts.userId) throw new AppError('AI requires an authenticated user', 401);
    if (!Array.isArray(messages) || JSON.stringify(messages).length > 24000)
      throw new AppError('AI context is too large', 400);
    if (!this.isAvailable())
      throw new AppError('AI is not configured (GEMINI_API_KEY missing)', 503);

    // Choose model
    const primaryModel   = opts.model    || selectModel(feature);
    const fallbackModel  = opts.fallback || process.env.AI_ESCALATION_MODEL || DEFAULT_FALLBACK;

    // Cache key
    const cacheKey = crypto.createHash('sha256').update(
      JSON.stringify({ feature, messages, model: primaryModel })
    ).digest('hex');

    const hit = cache.get(cacheKey);
    if (hit?.expires > Date.now()) return { ...hit.result, cached: true };
    if (pending.has(cacheKey))     return pending.get(cacheKey);

    const operation = (async () => {
      const client  = await pool.connect();
      const started = Date.now();
      try {
        await client.query('BEGIN');
        await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [opts.userId]);
        if (opts.projectId) await client.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE', [opts.projectId]);

        // Quota check
        const complexFeatures = ['PLAN_GENERATION','TASK_GENERATION','RECOVERY_PROPOSAL'];
        const maxOutput = complexFeatures.includes(feature) ? 2000 : 1000;
        const inputRate  = Number(process.env.GEMINI_INPUT_USD_PER_MILLION  || 0.3);
        const outputRate = Number(process.env.GEMINI_OUTPUT_USD_PER_MILLION || 2.5);
        const reservation = (JSON.stringify(messages).length * inputRate + maxOutput * outputRate) / 1e6;

        for (const [table, column, id] of [
          ['users',    'user_id',    opts.userId],
          ['projects', 'project_id', opts.projectId],
        ]) {
          if (!id) continue;
          const { rows: [account] } = await client.query(
            `SELECT ai_monthly_quota_usd FROM ${table} WHERE id=$1`, [id]
          );
          const { rows: [usage] } = await client.query(
            `SELECT COALESCE(SUM(estimated_cost_usd),0) AS spent FROM ai_usage_log WHERE ${column}=$1 AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)`,
            [id]
          );
          if (account?.ai_monthly_quota_usd != null &&
              Number(usage.spent) + reservation > Number(account.ai_monthly_quota_usd)) {
            throw new AppError('AI monthly budget exceeded', 429);
          }
        }

        // Try primary model, fall back once if it fails
        let result;
        try {
          result = await requestModel(primaryModel, messages, { ...opts, maxOutput });
        } catch (primaryErr) {
          if (fallbackModel && fallbackModel !== primaryModel &&
              process.env.AI_FALLBACK_ENABLED !== 'false') {
            console.warn(`[AI] Primary model "${primaryModel}" failed (${primaryErr.message}), escalating to "${fallbackModel}"`);
            result = await requestModel(fallbackModel, messages, { ...opts, maxOutput });
          } else {
            throw primaryErr;
          }
        }

        // Log usage
        await client.query(
          `INSERT INTO ai_usage_log (user_id, project_id, feature, model_provider, model_name, input_tokens, output_tokens, estimated_cost_usd, latency_ms)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [opts.userId, opts.projectId || null, feature, result.provider, result.model,
           result.inputTokens, result.outputTokens, reservation, Date.now() - started]
        );
        await client.query('COMMIT');

        if (cache.size >= 500) cache.delete(cache.keys().next().value);
        cache.set(cacheKey, { projectId: opts.projectId, result, expires: Date.now() + 600_000 });
        return { ...result, cached: false };

      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        // Log failure
        pool.query(
          `INSERT INTO ai_usage_log (user_id,project_id,feature,model_provider,model_name,estimated_cost_usd,success,error_message,latency_ms)
           VALUES ($1,$2,$3,$4,$5,$6,false,$7,$8)`,
          [opts.userId, opts.projectId||null, feature, 'gemini', primaryModel, 0,
           error.message?.slice(0,200), Date.now()-started]
        ).catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    })();

    pending.set(cacheKey, operation);
    try { return await operation; }
    finally { pending.delete(cacheKey); }
  }
};
