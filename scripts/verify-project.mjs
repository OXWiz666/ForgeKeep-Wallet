import { readFile } from 'node:fs/promises';

const root = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const setup = await readFile(new URL('../docs/setup.md', import.meta.url), 'utf8');
const environment = await readFile(new URL('../docs/environment.example', import.meta.url), 'utf8');
const requiredScripts = ['lint', 'test', 'typecheck', 'build'];
const requiredEnv = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL', 'REVENUECAT_WEBHOOK_AUTHORIZATION'];
const missingScripts = requiredScripts.filter(script => !root.scripts?.[script]);
const missingEnv = requiredEnv.filter(name => !setup.includes(name) && !environment.includes(name));
if (missingScripts.length || missingEnv.length) {
  throw new Error(`Project verification failed: scripts=${missingScripts.join(',') || 'ok'} env=${missingEnv.join(',') || 'ok'}`);
}
console.log('Project setup contract is complete.');
