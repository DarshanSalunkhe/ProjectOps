import crypto from 'crypto';

/**
 * In-memory store for short-lived, single-use OAuth exchange codes
 * Exchange codes are used to securely transfer authentication state from backend to frontend
 * without exposing JWT tokens in URLs
 */
class ExchangeCodeStore {
  constructor() {
    // Map structure: code -> { userId, createdAt, used }
    this.codes = new Map();
    
    // TTL for exchange codes (60 seconds)
    this.TTL = 60 * 1000;
    
    // Start background cleanup process
    this.startCleanup();
  }

  /**
   * Generate a cryptographically secure random exchange code
   * @returns {string} 32-byte hex string (64 characters)
   */
  generateCode() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new exchange code for a user
   * @param {number} userId - User ID to associate with the code
   * @returns {string} The generated exchange code
   */
  create(userId) {
    const code = this.generateCode();
    
    this.codes.set(code, {
      userId,
      createdAt: Date.now(),
      used: false
    });
    
    return code;
  }

  /**
   * Validate an exchange code without consuming it
   * @param {string} code - The exchange code to validate
   * @returns {boolean} True if code is valid, not expired, and not used
   */
  validate(code) {
    const entry = this.codes.get(code);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    const age = Date.now() - entry.createdAt;
    if (age > this.TTL) {
      this.codes.delete(code);
      return false;
    }
    
    // Check if already used
    if (entry.used) {
      return false;
    }
    
    return true;
  }

  /**
   * Consume an exchange code (single-use)
   * Validates the code and marks it as used, then returns the userId
   * @param {string} code - The exchange code to consume
   * @returns {number|null} The userId if valid, null otherwise
   */
  consume(code) {
    if (!this.validate(code)) {
      return null;
    }
    
    const entry = this.codes.get(code);
    const userId = entry.userId;
    
    // Immediately delete the code (single-use)
    this.codes.delete(code);
    
    return userId;
  }

  /**
   * Background cleanup process to remove expired codes
   * Runs every 5 minutes to prevent memory leaks
   */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const expiredCodes = [];
      
      for (const [code, entry] of this.codes.entries()) {
        const age = now - entry.createdAt;
        if (age > this.TTL) {
          expiredCodes.push(code);
        }
      }
      
      expiredCodes.forEach(code => this.codes.delete(code));
      
      if (expiredCodes.length > 0) {
        console.log(`[ExchangeCodeStore] Cleaned up ${expiredCodes.length} expired codes`);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Get store statistics (for monitoring/debugging)
   * @returns {object} Store statistics
   */
  getStats() {
    return {
      totalCodes: this.codes.size,
      unusedCodes: Array.from(this.codes.values()).filter(e => !e.used).length
    };
  }
}

// Export singleton instance
export const exchangeCodeStore = new ExchangeCodeStore();
