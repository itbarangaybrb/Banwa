import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hcdqrlainlhqidnxhfqy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Huu3IRMmW7Jz5AWvYaoRRA_J_cb1M7H';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;