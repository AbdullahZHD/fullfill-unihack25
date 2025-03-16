import OpenAI from 'openai';

// We'll use environment variables in production, but for development we'll use a constant
// The API key is stored here for demonstration purposes but should be in environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

// Create OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export default openai; 