import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://zjvdkedpmqxdxtawaanl.supabase.co'; 
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdmRrZWRwbXF4ZHh0YXdhYW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE1NzYsImV4cCI6MjA4NTE3NzU3Nn0.S3h1lpe9-5Q24Q5vrfONN_Fznc-36cr6g1z0lcZwnrs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);