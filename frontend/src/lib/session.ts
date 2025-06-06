/**
 * Session management for API calls
 * Handles IP-based persistent sessions for backend communication
 */

import { API_CONFIG } from '../config/constants';
import { log } from './logger';

class SessionManager {
  private sessionId: string | null = null;
  private sessionPromise: Promise<string> | null = null;

  /**
   * Get the current session ID, creating one if necessary
   * Now uses IP-based persistent sessions
   */
  async getSessionId(): Promise<string> {
    if (this.sessionId) {
      return this.sessionId;
    }

    // If we're already getting a session, wait for it
    if (this.sessionPromise) {
      return this.sessionPromise;
    }

    // Get or create IP-based session
    this.sessionPromise = this.getOrCreateSession();
    this.sessionId = await this.sessionPromise;
    this.sessionPromise = null;
    
    return this.sessionId;
  }

  /**
   * Get or create an IP-based persistent session
   */
  private async getOrCreateSession(): Promise<string> {
    try {
      log.debug('Getting IP-based persistent session', { component: 'SessionManager' });
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_SESSION}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get session: ${response.status}`);
      }

      const data = await response.json();
      const sessionId = data.session_id;
      
      log.info('Session ready', { 
        component: 'SessionManager',
        data: { 
          sessionId,
          persistent: data.session_info?.persistent || false,
          clientIp: data.session_info?.client_ip || 'unknown'
        }
      });
      
      return sessionId;
    } catch (error) {
      log.error('Failed to get session', {
        component: 'SessionManager',
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  }

  /**
   * Clear the current session (for error recovery)
   * Note: This doesn't delete the persistent session, just clears the local cache
   */
  clearSession(): void {
    this.sessionId = null;
    this.sessionPromise = null;
    log.debug('Session cache cleared', { component: 'SessionManager' });
  }

  /**
   * Get the current session ID without creating a new one
   */
  getCurrentSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if we have a cached session ID
   */
  hasSession(): boolean {
    return this.sessionId !== null;
  }

  /**
   * Force refresh the session (useful after network issues)
   */
  async refreshSession(): Promise<string> {
    this.clearSession();
    return this.getSessionId();
  }
}

// Create singleton instance
export const sessionManager = new SessionManager(); 