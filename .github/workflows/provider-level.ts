import { streamText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
 
const gateway = createGateway({
  headers: {
    'http-referer': 'https://myapp.vercel.app',
    'x-title': 'MyApp',
  },
});
 
const result = streamText({
  model: gateway('anthropic/claude-sonnet-4.5'),
  prompt: 'Hello, world!',
});
 
for await (const part of result.textStream) {
  process.stdout.write(part);
}
