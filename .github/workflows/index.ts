import { generateText } from 'ai';
 
const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  prompt: 'What is the capital of France?',
});
 
