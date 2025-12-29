import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gpxiovdwmjvhpvpqgwgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGlvdmR3bWp2aHB2cHFnd2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDQ4MTUsImV4cCI6MjA4MjUyMDgxNX0.4GiQ9rCeEUcDFngOd-czCyOY-oMWg1bXE8gzzaAAnco';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
