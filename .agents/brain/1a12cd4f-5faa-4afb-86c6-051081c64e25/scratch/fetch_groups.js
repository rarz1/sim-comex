const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parser for .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkGroups() {
  const { data: groups, error } = await supabase.from('groups').select('*');
  if (error) {
    console.error("Error fetching groups:", error);
    return;
  }
  console.log("=== Groups in Supabase ===");
  console.log(JSON.stringify(groups, null, 2));
}

checkGroups();
