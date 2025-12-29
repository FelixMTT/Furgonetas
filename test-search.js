const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gpxiovdwmjvhpvpqgwgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGlvdmR3bWp2aHB2cHFnd2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDQ4MTUsImV4cCI6MjA4MjUyMDgxNX0.4GiQ9rCeEUcDFngOd-czCyOY-oMWg1bXE8gzzaAAnco';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSearch() {
    console.log('Testing search patterns...\n');

    const testCases = [
        '5545JKZ',      // Exact match
        '5545',         // Partial match
        'jkz',          // Lowercase partial
        'JKZ',          // Uppercase partial
        '5545jkz',      // Lowercase full
        ' 5545JKZ ',    // With spaces
        'abc-123',      // Non-existent
    ];

    for (const searchTerm of testCases) {
        console.log(`\n=== Searching for: "${searchTerm}" ===`);

        // Test 1: ilike search (what the app uses)
        const { data: ilikeData, error: ilikeError } = await supabase
            .from('listado_furgonetas')
            .select('*')
            .ilike('matriculas', `%${searchTerm}%`);

        if (ilikeError) {
            console.error('ilike error:', ilikeError);
        } else {
            console.log(`ilike found: ${ilikeData.length} rows`);
            ilikeData.forEach(row => {
                console.log(`  - ${row.matriculas} (${row.nombre_conductor})`);
            });
        }

        // Test 2: eq search (exact match)
        const { data: eqData, error: eqError } = await supabase
            .from('listado_furgonetas')
            .select('*')
            .eq('matriculas', searchTerm);

        if (eqError) {
            console.error('eq error:', eqError);
        } else {
            console.log(`eq found: ${eqData.length} rows`);
        }
    }

    // Test column names
    console.log('\n\n=== Testing column names ===');
    const { data: sampleRow, error: sampleError } = await supabase
        .from('listado_furgonetas')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error('Error getting sample:', sampleError);
    } else if (sampleRow.length > 0) {
        console.log('Sample row columns:', Object.keys(sampleRow[0]));
        console.log('Sample row values:', sampleRow[0]);
    }
}

testSearch().catch(console.error);
