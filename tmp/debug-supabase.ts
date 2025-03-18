// For debugging Supabase connection and schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlmjdtrhqfotyzxborcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbWpkdHJocWZvdHl6eGJvcmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMzEzMDcsImV4cCI6MjA1NzgwNzMwN30.NRbISywhUEqBFjK1jPX0CorGXHCqUjteIo2wdP5_xiA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  try {
    // Test database tables
    console.log('\nListing available tables:');
    
    // Try basic fetch all tables from a specific roadmap ID
    const roadmapId = 'df3033db-856a-44c2-9850-8d74d806325c';
    
    console.log(`\nChecking roadmap ${roadmapId}:`);
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', roadmapId)
      .single();
      
    if (roadmapError) {
      console.error('Error fetching roadmap:', roadmapError);
    } else {
      console.log('Roadmap:', roadmap);
      
      // Now try to get user info using the owner_id
      if (roadmap.owner_id) {
        console.log(`\nTrying to get owner info for ID: ${roadmap.owner_id}`);
        // Try auth.users
        const { data: owner, error: ownerError } = await supabase.auth.admin.getUserById(roadmap.owner_id);
        
        if (ownerError) {
          console.error('Error fetching owner from auth.admin:', ownerError);
        } else {
          console.log('Owner from auth.admin:', owner);
        }
      }
    }
    
    // Get Supabase database schema version
    console.log('\nTesting auth endpoints:');
    
    // Try getting current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
    } else {
      console.log('Current user:', userData);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testTables().then(() => console.log('Test complete'));
