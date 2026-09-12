import { createClient } from "@supabase/supabase-js";

// ── STEP 3: Paste your Supabase URL and anon key here ─────────────────────────
// Get these from: supabase.com → Your Project → Settings → API
export const SUPABASE_URL = "https://jmtbmtqmqpcggbaacxwk.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdGJtdHFtcXBjZ2diYWFjeHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NzcwMTUsImV4cCI6MjEwNDM1MzAxNX0.ROvaT3Npl2yA1zvqd-z0NoOaDeMdMyCzat5a_e51hIc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type SessionRow = {
  id: string;
  data: unknown;
  created_at: string;
};
