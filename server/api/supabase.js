import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://iwhpsyzpwrtuevaaaomr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aHBzeXpwd3J0dWV2YWFhb21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODk5MjUsImV4cCI6MjA4OTE2NTkyNX0.1oeKdCHbDuDjl2rC7mukKGk_S0chZwIV4-AXtlmbGN0';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;