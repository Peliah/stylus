import { getSessionStatus } from './openwa';
import { redis } from './redis';

const STATUS_KEY = 'openwa:status';
const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes in ms

export async function checkGatewayHealth() {
  const check = await getSessionStatus();
  const currentStatus = check.status;

  try {
    const lastStatus = await redis.get(STATUS_KEY);
    
    if (lastStatus !== currentStatus) {
      console.log(`[Health Monitor] OpenWA session status changed: ${lastStatus || 'UNKNOWN'} -> ${currentStatus}`);
      await redis.set(STATUS_KEY, currentStatus);
    }
  } catch (error) {
    console.error('[Health Monitor] Failed to store status in Redis:', error);
  }
}

/**
 * Starts the periodic cron checker for the OpenWA gateway.
 */
export function startHealthCheck() {
  console.log('[Health Monitor] Initializing gateway connection checker (2-minute intervals)...');
  
  // Run initial check immediately on boot
  checkGatewayHealth().catch((err) => {
    console.error('[Health Monitor] Initial health check failed:', err);
  });

  // Schedule periodic checks
  setInterval(async () => {
    await checkGatewayHealth();
  }, CHECK_INTERVAL);
}
export default startHealthCheck;
