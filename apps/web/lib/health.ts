import {
  type GatewayConnectionState,
  isGatewayConnected,
} from './gateway';
import { getGatewaySnapshot } from './openwa-client';
import { promoteOutboundBacklog } from './outbound-queue';
import { redis } from './redis';

const STATUS_KEY = 'openwa:status';
const STATE_KEY = 'openwa:state';
const CHECK_INTERVAL = 30 * 1000; // 30 seconds

export async function checkGatewayHealth(): Promise<GatewayConnectionState> {
  const snapshot = await getGatewaySnapshot();
  const currentState = snapshot.state;

  try {
    const lastState = (await redis.get(STATE_KEY)) as GatewayConnectionState | null;

    if (lastState !== currentState) {
      console.log(
        `[Health Monitor] Gateway state: ${lastState || 'UNKNOWN'} -> ${currentState} (${snapshot.rawStatus})`
      );

      if (isGatewayConnected(currentState) && lastState && !isGatewayConnected(lastState)) {
        await promoteOutboundBacklog();
      }
    }

    await redis.set(STATUS_KEY, snapshot.rawStatus);
    await redis.set(STATE_KEY, currentState);
  } catch (error) {
    console.error('[Health Monitor] Failed to store status in Redis:', error);
  }

  return currentState;
}

export async function getCachedGatewayState(): Promise<GatewayConnectionState | null> {
  try {
    const state = await redis.get(STATE_KEY);
    if (
      state === 'connected' ||
      state === 'disconnected' ||
      state === 'unreachable'
    ) {
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Starts the periodic gateway health checker.
 */
export function startHealthCheck() {
  console.log('[Health Monitor] Initializing gateway checker (30s intervals)...');

  checkGatewayHealth().catch((err) => {
    console.error('[Health Monitor] Initial health check failed:', err);
  });

  setInterval(() => {
    checkGatewayHealth().catch((err) => {
      console.error('[Health Monitor] Periodic health check failed:', err);
    });
  }, CHECK_INTERVAL);
}

export default startHealthCheck;
