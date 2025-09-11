#!/usr/bin/env node

/**
 * Test Supabase Connection
 * This script tests if your Supabase setup is working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  console.log('Please check your .env.local file');
  process.exit(1);
}

if (supabaseUrl.includes('placeholder')) {
  console.log('⚠️  Still using placeholder Supabase URL');
  console.log('Please update .env.local with your actual Supabase credentials');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`📍 Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "sessions" does not exist')) {
        console.log('❌ Database schema not set up');
        console.log('📋 Please run the SQL schema from supabase-schema.sql in your Supabase dashboard');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/lsgmjswgjlfgnfukbiwg/sql');
      } else {
        console.log('❌ Database error:', error.message);
      }
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log('✅ Database schema is set up');
    console.log('🚀 Your app is ready to use real-time features!');

  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testConnection();
