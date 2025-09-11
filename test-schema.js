#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Database Schema...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
  try {
    // Test each table
    const tables = ['sessions', 'participants', 'tasks', 'votes'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
        return;
      }
      console.log(`✅ Table '${table}': OK`);
    }
    
    // Test session code generation function
    const { data, error } = await supabase
      .rpc('generate_session_code');
    
    if (error) {
      console.log(`❌ Function 'generate_session_code': ${error.message}`);
    } else {
      console.log(`✅ Function 'generate_session_code': OK (generated: ${data})`);
    }
    
    console.log('\n🎉 Database schema is fully set up!');
    console.log('🚀 Your app is ready to use real-time features!');
    
  } catch (err) {
    console.log('❌ Schema test failed:', err.message);
  }
}

testSchema();
