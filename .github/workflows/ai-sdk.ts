import { streamText } from 'ai';
 
const result = streamText({
  headers: {
    'http-referer': 'https://myapp.vercel.app',
    'x-title': 'MyApp',
  },
  model: 'anthropic/claude-sonnet-4.5',
  prompt: 'Hello, world!',
});
 
for await (const part of result.textStream) {
  process.stdout.write(part);
}
