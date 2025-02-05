import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://psemkoxgevbbonilignl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZW1rb3hnZXZiYm9uaWxpZ25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MzMxMDQsImV4cCI6MjA1NDMwOTEwNH0.AQ2k_S0EsQFEBQAHIRoFtJ42gORL8vJYLmG_yLMEQ_8'

export const supabase = createClient(supabaseUrl, supabaseKey) 