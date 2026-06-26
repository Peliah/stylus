export type GatewayConnectionState = 'connected' | 'disconnected' | 'unreachable';

export interface GatewaySnapshot {
  sessionId: string;
  rawStatus: string;
  state: GatewayConnectionState;
  phone: string | null;
  pushName: string | null;
  lastError: string | null;
}

const CONNECTED_STATUSES = new Set(['ready', 'connected', 'authenticated']);

export function normalizeGatewayStatus(raw: string): GatewayConnectionState {
  const status = raw.toLowerCase();
  if (status === 'unreachable') return 'unreachable';
  if (CONNECTED_STATUSES.has(status)) return 'connected';
  return 'disconnected';
}

export function isGatewayConnected(state: GatewayConnectionState): boolean {
  return state === 'connected';
}
