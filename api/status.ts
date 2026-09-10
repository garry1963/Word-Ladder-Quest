import { getCollinsApiKey } from '../src/server/collinsService';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const hasKey = Boolean(getCollinsApiKey());
  return res.status(200).json({
    status: 'ok',
    provider: 'Collins English Dictionary API',
    apiKeyConfigured: hasKey,
    mode: hasKey ? 'live_collins_api' : 'offline_fallback',
  });
}
