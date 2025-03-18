// For debugging Supabase connection and schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlmjdtrhqfotyzxborcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbWpkdHJocWZvdHl6eGJvcmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMzEzMDcsImV4cCI6MjA1NzgwNzMwN30.NRbISywhUEqBFjK1jPX0CorGXHCqUjteIo2wdP5_xiA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  try {
    // First get the user ID to use as created_by
    const userId = 'cc4a82bf-1f9a-44ae-b3ad-27eae06a04ab'; // Owner ID of the roadmap
    
    // Test status creation with order_index and created_by
    console.log('\nTrying to insert a test status with order_index and created_by:');
    const { data: insertedStatus, error: insertError } = await supabase
      .from('statuses')
      .insert({
        name: 'Test Status',
        color: '#ff0000',
        roadmap_id: 'df3033db-856a-44c2-9850-8d74d806325c',
        order_index: 0,
        created_by: userId
      })
      .select();
      
    if (insertError) {
      console.error('Error inserting test status:', insertError);
    } else {
      console.log('Test status inserted successfully:', insertedStatus);
    }
    
    // Try to query statuses to see what fields are available
    console.log('\nGetting all fields from statuses:');
    const { data: allStatuses, error: allError } = await supabase
      .from('statuses')
      .select('*')
      .limit(5);
      
    if (allError) {
      console.error('Error getting statuses:', allError);
    } else {
      console.log('Statuses found:', allStatuses);
      if (allStatuses && allStatuses.length > 0) {
        console.log('Status fields available:', Object.keys(allStatuses[0]));
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testTables().then(() => console.log('Test complete'));
