// =============================================================================
// Annotation Sync Utilities (Adapter for Agentation Zero)
// =============================================================================

import type { Annotation } from "../types";

// =============================================================================
// Types matching package/src/types.ts (partial)
// =============================================================================

export interface Session {
  id: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived";
}

export interface SessionWithAnnotations extends Session {
  annotations: Annotation[];
}

export type ActionResponse = {
  success: boolean;
  annotationCount: number;
  delivered: {
    sseListeners: number;
    webhooks: number;
    total: number;
  };
};

// =============================================================================
// API Discovery
// =============================================================================

let cachedApiUrl: string | null = null;

async function getApiUrl(): Promise<string> {
    if (cachedApiUrl) return cachedApiUrl;

    // Try to fetch config from local Vite server (which knows the public URL)
    try {
        const res = await fetch('/api/config');
        if (res.ok) {
            const config = await res.json();
            if (config.apiUrl) {
                cachedApiUrl = config.apiUrl;
                return config.apiUrl;
            }
        }
    } catch (e) {
        // ignore
    }

    // Fallback: assume local proxy
    return ''; // relative path
}

function getEndpoint(baseUrl: string): string {
    return baseUrl ? `${baseUrl}/api/annotations` : '/api/annotations';
}

// =============================================================================
// Adapter Functions
// =============================================================================

/**
 * List all sessions from the server.
 * Agentation Zero doesn't have sessions, so we return a dummy one.
 */
export async function listSessions(endpoint?: string): Promise<Session[]> {
    return [{
        id: 'default-session',
        url: window.location.href,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    }];
}

/**
 * Create a new session on the server.
 * No-op in Zero, returns default session.
 */
export async function createSession(
  endpoint: string,
  url: string
): Promise<Session> {
  // We can treat the "session" as just the current page/context
  return {
    id: 'default-session',
    url,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active'
  };
}

/**
 * Get an existing session with its annotations.
 * In Zero, this fetches ALL annotations.
 */
export async function getSession(
  endpoint: string,
  sessionId: string
): Promise<SessionWithAnnotations> {
  const baseUrl = await getApiUrl();
  const url = getEndpoint(baseUrl);
  
  const response = await fetch(url);
  if (!response.ok) {
      throw new Error(`Failed to fetch annotations: ${response.status}`);
  }
  const annotations = await response.json();

  return {
    id: sessionId,
    url: window.location.href,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    annotations
  };
}

/**
 * Sync a new annotation to the server.
 * Returns the annotation with any server-assigned fields.
 */
export async function syncAnnotation(
  endpoint: string,
  sessionId: string,
  annotation: Annotation
): Promise<Annotation> {
  const baseUrl = await getApiUrl();
  const url = getEndpoint(baseUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(annotation),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync annotation: ${response.status}`);
  }

  return response.json();
}

/**
 * Update an annotation on the server.
 */
export async function updateAnnotation(
  endpoint: string,
  annotationId: string,
  data: Partial<Annotation>
): Promise<Annotation> {
  const baseUrl = await getApiUrl();
  const url = getEndpoint(baseUrl);

  // We send the ID in the body for the PATCH handler we wrote
  const payload = { ...data, id: annotationId };

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update annotation: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete an annotation from the server.
 */
export async function deleteAnnotation(
  endpoint: string,
  annotationId: string
): Promise<void> {
  const baseUrl = await getApiUrl();
  // We implemented DELETE with query param support: /api/annotations?id=...
  const url = `${getEndpoint(baseUrl)}?id=${annotationId}`;

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete annotation: ${response.status}`);
  }
}

/**
 * Request the agent to act on annotations.
 * No-op in Zero for now.
 */
export async function requestAction(
  endpoint: string,
  sessionId: string,
  output: string
): Promise<ActionResponse> {
  console.log('[Agentation Zero] Action requested:', output);
  return {
    success: true,
    annotationCount: 1,
    delivered: {
      sseListeners: 0,
      webhooks: 0,
      total: 0
    }
  };
}

// Helper aliases that the UI might use
export const fetchAnnotations = async () => {
    const session = await getSession('', 'default');
    return session.annotations;
};
export const saveAnnotation = async (a: Annotation) => syncAnnotation('', 'default', a);
