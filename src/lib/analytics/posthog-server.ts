import { PostHog } from 'posthog-node';

let instance: PostHog | null = null;

function getPostHog(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!instance) {
    instance = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return instance;
}

export async function trackServer(event: string, distinctId: string, properties?: Record<string, unknown>) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture({ event, distinctId, properties });
  await ph.shutdown().catch(() => {});
}
