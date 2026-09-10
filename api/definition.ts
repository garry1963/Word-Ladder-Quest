import { getCollinsDefinition } from '../src/server/collinsService';

export default async function handler(req: any, res: any) {
  // Prevent any caching per Collins API terms
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const word = req.query.word || (req.body && req.body.word);
  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'A valid "word" query parameter is required.' });
  }

  const result = await getCollinsDefinition(word);
  return res.status(result.found ? 200 : 404).json(result);
}
