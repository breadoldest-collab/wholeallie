function getGeminiApiKey(mode = 'agent') {
  const normalizedMode = String(mode || 'agent').toLowerCase();

  const envMap = {
    agent: [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_AGENT_API_KEY,
    ],
    summary: [
      process.env.GEMINI_SUMMARY_API_KEY,
      process.env.GEMINI_SUMMARIZER_API_KEY,
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_AGENT_API_KEY,
    ],
  };

  const candidates = envMap[normalizedMode] || envMap.agent;
  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || '';
}

module.exports = { getGeminiApiKey };
