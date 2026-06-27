/**
 * Supabase Edge Function: update-event-statuses
 * Cron job that updates event status based on dates.
 * Statuses: upcoming, ongoing, finished, cancelled
 *
 * Runs: every 6 hours via pg_cron
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (_req: Request) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const now = new Date().toISOString()

    // Update events to 'ongoing' where start_date <= now AND end_date >= now
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_event_statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Event statuses updated',
      timestamp: now,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
