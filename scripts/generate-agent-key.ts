/**
 * Script to generate a new agent API key.
 *
 * Usage:
 *   npx ts-node scripts/generate-agent-key.ts
 *
 * Output:
 *   - API Key (store in N8N Credentials)
 *   - API Key Hash (store in database agents.api_key_hash)
 *
 * NEVER store the plain API key in the database!
 * The plain key goes only to N8N Credentials (encrypted).
 */

import bcrypt from 'bcrypt'
import crypto from 'crypto'

async function generateAgentApiKey() {
  console.log('\n=== BOTFY AGENT API KEY GENERATOR ===\n')

  // 1. Generate cryptographically secure random key
  // 32 bytes = 64 hex characters (256 bits of entropy)
  const apiKey = crypto.randomBytes(32).toString('hex')

  // 2. Hash with bcrypt (12 rounds - recommended for API keys)
  // ~300ms on modern hardware, provides timing attack protection
  const saltRounds = 12
  console.log('Generating bcrypt hash (this may take a moment)...')
  const apiKeyHash = await bcrypt.hash(apiKey, saltRounds)

  // 3. Output results
  console.log('\n--- API Key (STORE IN N8N CREDENTIALS) ---')
  console.log('This key is shown ONCE. Store it securely!')
  console.log('\n' + apiKey + '\n')

  console.log('--- API Key Hash (STORE IN DATABASE) ---')
  console.log('Add this to the agents table api_key_hash column:')
  console.log('\n' + apiKeyHash + '\n')

  // 4. Show example SQL
  console.log('--- EXAMPLE SQL ---')
  console.log(`
INSERT INTO agents (id, name, description, api_key_hash, user_id, active)
VALUES (
  gen_random_uuid(),
  'Marilia - WhatsApp Agent',
  'N8N AI Agent for WhatsApp patient interactions',
  '${apiKeyHash}',
  '<user-id-here>',  -- Replace with actual user ID
  true
);
  `)

  // 5. Show N8N Credentials setup
  console.log('--- N8N CREDENTIALS SETUP ---')
  console.log(`
In N8N:
1. Go to Credentials > Add Credential > Header Auth
2. Name: "Botfy API Key"
3. Name: "Authorization"
4. Value: "Bearer ${apiKey}"
5. Save
  `)

  console.log('=== DONE ===\n')
}

// Run the script
generateAgentApiKey().catch(console.error)
