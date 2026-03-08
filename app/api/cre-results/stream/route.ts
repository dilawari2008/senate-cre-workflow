import { addListener } from '@/lib/cre-results-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      send({ type: 'connected', timestamp: new Date().toISOString() });

      const removeListener = addListener((proposalId, event) => {
        send({ proposalId, ...event });
      });

      const heartbeat = setInterval(() => {
        send({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }, 15000);

      const cleanup = () => {
        removeListener();
        clearInterval(heartbeat);
      };

      controller.enqueue(encoder.encode(''));

      const checkClosed = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(''));
        } catch {
          cleanup();
          clearInterval(checkClosed);
        }
      }, 5000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
