import { aiService } from './aiService.js';
export async function explainProjectResult(feature, data, userId, projectId) {
  try {
    const result = await aiService.call(feature, [
      { role: 'system', content: 'Explain the supplied backend calculation in plain language and suggest practical next steps. Never alter scores, assignments, dependencies, or dates. Distinguish suggestions from facts. Maximum 200 words.' },
      { role: 'user', content: JSON.stringify(data).slice(0, 10000) }
    ], { userId, projectId: Number(projectId) });
    return { text: result.content, provider: result.provider };
  } catch (error) { return { text: null, unavailable: true, reason: error.statusCode === 429 ? 'AI monthly budget exceeded' : 'Generation unavailable; backend calculations remain available.' }; }
}
