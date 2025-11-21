import { Pool } from 'pg';

// Ensure DATABASE_URL is present and a string. If it's missing here it usually means
// dotenv/config wasn't loaded before this module was imported (dotenv must run in index.ts).
const conn = process.env.DATABASE_URL;
if (!conn || typeof conn !== 'string') {
	throw new Error('DATABASE_URL is missing or not a string. Make sure your .env is loaded before importing db.');
}

// Mask credentials for logging. Prefer using the URL parser but fall back to a safe regex.
let masked: string;
try {
	const u = new URL(conn);
	masked = `${u.protocol}//***:***@${u.host}${u.pathname}`;
} catch {
	masked = conn.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
}

console.log('server db connecting to:', masked);

const pool = new Pool({ connectionString: conn });
export default pool;