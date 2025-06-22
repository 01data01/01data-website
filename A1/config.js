// Claude API Keys Configuration - Base64 encoded for basic obfuscation
const ENCODED_KEYS = [
  // Encoded API keys - add your real keys here and I'll encode them
  'ENCODED_KEY_1_PLACEHOLDER',
  'ENCODED_KEY_2_PLACEHOLDER',
  'ENCODED_KEY_3_PLACEHOLDER',
  // Add more encoded keys...
].filter(key => !key.includes('PLACEHOLDER'));

// Performance cache for decoded keys
let cachedApiKeys = null;
let lastCacheTime = 0;
const CACHE_DURATION = 300000; // 5 minutes in milliseconds

// Optimized validation patterns
const API_KEY_PATTERN = /^sk-ant-[a-zA-Z0-9\-_]{95,}$/;
const ENCODING_PATTERN = /^[A-Za-z0-9+/=]+$/;

// Safe decoding function with enhanced error handling
function safeDecodeKey(encodedKey) {
  try {
    // Validate base64 format first
    if (!encodedKey || typeof encodedKey !== 'string' || !ENCODING_PATTERN.test(encodedKey)) {
      return null;
    }
    
    // Attempt decoding
    const decoded = atob(encodedKey);
    
    // Validate decoded key format
    if (!decoded || !API_KEY_PATTERN.test(decoded)) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.warn('Failed to decode API key:', error.message);
    return null;
  }
}

// Optimized key validation
function validateApiKey(key) {
  return key && 
         typeof key === 'string' && 
         API_KEY_PATTERN.test(key) &&
         key.length >= 95 && 
         key.length <= 200; // Reasonable length bounds
}

// Get API keys with caching for performance
function getApiKeys() {
  const now = Date.now();
  
  // Return cached keys if still valid
  if (cachedApiKeys && (now - lastCacheTime) < CACHE_DURATION) {
    return cachedApiKeys;
  }
  
  // Decode and validate keys
  const decodedKeys = [];
  
  for (const encodedKey of ENCODED_KEYS) {
    const decoded = safeDecodeKey(encodedKey);
    if (decoded && validateApiKey(decoded)) {
      decodedKeys.push(decoded);
    }
  }
  
  // Update cache
  cachedApiKeys = decodedKeys;
  lastCacheTime = now;
  
  // Log key statistics for monitoring
  console.log(`Loaded ${decodedKeys.length} valid API keys from ${ENCODED_KEYS.length} encoded entries`);
  
  return decodedKeys;
}

// Get keys with immediate validation
const API_KEYS = getApiKeys();

// ElevenLabs Configuration for A1 Assistant
const ELEVENLABS_CONFIG = {
  // A1 Assistant uses ELEVENLABS_AGENT_ID_3 as default (configured in Netlify environment)
  agentId: null, // Will be fetched securely from Netlify function (defaults to ELEVENLABS_AGENT_ID_3)
  agentId3: null, // A1 Assistant primary agent (ELEVENLABS_AGENT_ID_3)
  agentId2: null, // Secondary agent for ELA mode
  apiKey: null, // Set this to your ElevenLabs API key for server-side operations
  // Voice configuration
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.8,
    speed: 1.0
  },
  // Audio settings
  audioSettings: {
    sampleRate: 16000,
    format: 'pcm_16000'
  }
};

// Global configuration object
window.config = {
  claude: {
    apiKeys: API_KEYS
  },
  elevenlabs: ELEVENLABS_CONFIG
};

// Export functions for runtime key management
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    API_KEYS,
    getApiKeys,
    validateApiKey,
    safeDecodeKey,
    ELEVENLABS_CONFIG
  };
}