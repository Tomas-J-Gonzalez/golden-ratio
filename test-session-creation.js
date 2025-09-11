#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Session Creation...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSessionCreation() {
  try {
    // Generate a test session code
    const sessionCode = 'TEST' + Math.random().toString(36).substr(2, 2).toUpperCase();
    
    console.log(`Creating session with code: ${sessionCode}`);
    
    // Create a session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        code: sessionCode,
        moderator_id: 'test-moderator',
        is_active: true
      })
      .select()
      .single();
    
    if (sessionError) {
      console.log('❌ Session creation failed:', sessionError.message);
      return;
    }
    
    console.log('✅ Session created successfully:', sessionData);
    
    // Create a participant
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: sessionData.id,
        nickname: 'Test Moderator',
        is_moderator: true
      })
      .select()
      .single();
    
    if (participantError) {
      console.log('❌ Participant creation failed:', participantError.message);
      return;
    }
    
    console.log('✅ Participant created successfully:', participantData);
    
    // Clean up test data
    await supabase.from('sessions').delete().eq('id', sessionData.id);
    console.log('🧹 Test data cleaned up');
    
    console.log('\n🎉 Session creation is working perfectly!');
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

testSessionCreation();
