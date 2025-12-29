const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gpxiovdwmjvhpvpqgwgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGlvdmR3bWp2aHB2cHFnd2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDQ4MTUsImV4cCI6MjA4MjUyMDgxNX0.4GiQ9rCeEUcDFngOd-czCyOY-oMWg1bXE8gzzaAAnco';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    console.log('Testing Supabase connection...');

    // First, let's see the table structure
    const { data, error } = await supabase
        .from('listado_furgonetas')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error querying table:', error);
        return;
    }

    console.log(`Found ${data.length} rows:`);
    data.forEach((row, i) => {
        console.log(`Row ${i}:`, {
            id: row.id,
            matriculas: row.matriculas,
            nombre_conductor: row.nombre_conductor
        });
    });

    // Test search for a specific matricula
    const testMatricula = 'ABC-123'; // Change this to actual value
    console.log(`\nSearching for matricula containing: "${testMatricula}"`);

    const { data: searchData, error: searchError } = await supabase
        .from('listado_furgonetas')
        .select('*')
        .ilike('matriculas', `%${testMatricula}%`);

    if (searchError) {
        console.error('Search error:', searchError);
        return;
    }

    console.log(`Search found ${searchData.length} rows`);
    searchData.forEach(row => {
        console.log('Found:', row.matriculas, row.nombre_conductor);
    });
}

testQuery().catch(console.error);
