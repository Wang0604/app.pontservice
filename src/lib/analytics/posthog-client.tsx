'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

export function PostHogAnalytics({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
    if (key && typeof window !== 'undefined') {
      posthog.init(key, {
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
      });
    }
  }, []);

  return process.env.NEXT_PUBLIC_POSTHOG_KEY ? (
    <PostHogProvider client={posthog}>{children}</PostHogProvider>
  ) : (
    <>{children}</>
  );
}

export function track(
  event:
    | 'lead_created'
    | 'contract_sent'
    | 'contract_signed'
    | 'payment_submitted'
    | 'order_activated'
    | 'tool_run_started'
    | 'tool_run_succeeded'
    | 'tool_run_failed',
  properties?: Record<string, unknown>,
) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.identify(userId, properties);
  }
}
