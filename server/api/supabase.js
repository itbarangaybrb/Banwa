import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://zkznbbucwdfsqgjhflmu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprem5iYnVjd2Rmc3FnamhmbG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMTM4NjksImV4cCI6MjA3Nzg4OTg2OX0.DNBOQAsrPsNbRQQ7iMPrgMthaRmyP6N6nzMLnJAC9ks'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default supabase;