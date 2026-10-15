import "server-only"

/**
 * Inactivity timeout configuration.
 * A user (or admin) is considered "inactive" after this many minutes.
 */
export const INACTIVITY_TIMEOUT_MINUTES = 5

/**
 * How often the frontend should ping the server to refresh last_activity_at.
 * Should be less than the timeout, so the server knows the user is still there.
 */
export const ACTIVITY_PING_INTERVAL_MS = 60 * 1000 // 1 minute

/**
 * How long before timeout to show the "Are you still there?" warning.
 */
export const IDLE_WARNING_MS = 30 * 1000 // 30 seconds before logout