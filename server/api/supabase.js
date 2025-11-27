import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://owtynidzffffsiftqxbh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHluaWR6ZmZmZnNpZnRxeGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjE1NjMsImV4cCI6MjA3OTc5NzU2M30._Hbh-nCdTuVf6vuCb2Th2ruanFBF4wdZIVAVvrfLorY'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default supabase;