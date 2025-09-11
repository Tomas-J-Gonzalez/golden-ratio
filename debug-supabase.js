#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Debugging Supabase Connection...\n');

console.log('Environment Variables:');
console.log('URL:', supabaseUrl);
console.log('Key present:', supabaseKey ? 'Yes' : 'No');
console.log('Is demo mode:', supabaseUrl?.includes('placeholder'));

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🧪 Testing basic connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Basic connection works');
    
    // Test 2: Create a test session
    console.log('\n🧪 Testing session creation...');
    const testCode = 'TEST' + Math.random().toString(36).substr(2, 2).toUpperCase();
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        code: testCode,
        moderator_id: 'test-moderator-' + Date.now(),
        is_active: true
      })
      .select()
      .single();
    
    if (sessionError) {
      console.log('❌ Session creation failed:', sessionError.message);
      console.log('Error details:', sessionError);
      return;
    }
    
    console.log('✅ Session creation works:', sessionData);
    
    // Test 3: Create a participant
    console.log('\n🧪 Testing participant creation...');
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: sessionData.id,
        nickname: 'Test User',
        is_moderator: true
      })
      .select()
      .single();
    
    if (participantError) {
      console.log('❌ Participant creation failed:', participantError.message);
      console.log('Error details:', participantError);
      return;
    }
    
    console.log('✅ Participant creation works:', participantData);
    
    // Clean up
    await supabase.from('sessions').delete().eq('id', sessionData.id);
    console.log('🧹 Test data cleaned up');
    
    console.log('\n🎉 All tests passed! Supabase is working correctly.');
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testConnection();
