// Claude API Keys Configuration - Base64 encoded for basic obfuscation
const ENCODED_KEYS = [
  // Encoded API keys - add your real keys here and I'll encode them
  'ENCODED_KEY_1_PLACEHOLDER',
  'ENCODED_KEY_2_PLACEHOLDER',
  'ENCODED_KEY_3_PLACEHOLDER',
  // Add more encoded keys...
].filter(key => !key.includes('PLACEHOLDER'));

// Decode keys for use
const API_KEYS = ENCODED_KEYS.map(encodedKey => {
  try {
    return Buffer.from(encodedKey, 'base64').toString('utf8');
  } catch {
    return null;
  }
}).filter(key => key && key.startsWith('sk-ant-'));

module.exports = { API_KEYS };