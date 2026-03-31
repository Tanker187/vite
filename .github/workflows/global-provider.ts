import { streamText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
 
const gateway = createGateway({
  headers: {
    'http-referer': 'https://myapp.vercel.app',
    'x-title': 'MyApp',
  },
});
 
// Set your provider as the default to allow plain-string model id creation with this instance
globalThis.AI_SDK_DEFAULT_PROVIDER = gateway;
 
// Now you can use plain string model IDs and they'll use your custom provider
const result = streamText({
  model: 'anthropic/claude-sonnet-4.5', // Uses the gateway provider with headers
  prompt: 'Hello, world!',
});
 
for await (const part of result.textStream) {
  process.stdout.write(part);
}
