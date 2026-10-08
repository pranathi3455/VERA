import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Support both standard SUPABASE_SERVICE_ROLE_KEY and modern SUPABASE_SECRET_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseServiceRoleKey && supabaseUrl.trim() !== '' && supabaseServiceRoleKey.trim() !== '') {
  try {
    supabase = createClient(supabaseUrl.trim(), supabaseServiceRoleKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    isConfigured = true;
  } catch (err) {
    console.warn('Warning: Failed to initialize Supabase client with provided credentials.');
    supabase = null;
    isConfigured = false;
  }
} else {
  // Graceful fallback when credentials are not yet set
  isConfigured = false;
}

/**
 * Perform a graceful database health check query
 * Never throws unhandled exceptions; returns structured status.
 */
export const checkDatabaseHealth = async () => {
  if (!isConfigured || !supabase) {
    return {
      status: 'not_configured',
      connected: false,
      message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured in backend environment.'
    };
  }

  const startTime = Date.now();
  try {
    // Perform a lightweight probe query against the database
    const { data, error } = await supabase
      .from('decisions')
      .select('id')
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      // Check if table hasn't been created yet vs connection failure
      if (error.code === '42P01' || error.message?.includes('relation "public.decisions" does not exist') || error.message?.includes('relation "decisions" does not exist') || error.message?.includes('Could not find the table')) {
        return {
          status: 'connected_tables_pending',
          connected: true,
          latencyMs,
          message: 'Connected to Supabase PostgreSQL successfully! (Tables from database/schema.sql are ready to be run in Supabase SQL editor).'
        };
      }

      return {
        status: 'connection_error',
        connected: false,
        latencyMs,
        message: 'Database service is currently unreachable.'
      };
    }

    return {
      status: 'connected',
      connected: true,
      latencyMs,
      message: 'Database connection verified and responsive.'
    };
  } catch (err) {
    return {
      status: 'error',
      connected: false,
      message: 'Unable to verify database status.'
    };
  }
};

export { supabase, isConfigured };
export default supabase;
