import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getDeepseekClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY ?? 'placeholder',
    })
  }
  return _client
}
