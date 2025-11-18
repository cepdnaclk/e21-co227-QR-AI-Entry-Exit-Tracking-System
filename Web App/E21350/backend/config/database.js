const { createClient } = require('@supabase/supabase-js'); // Import Supabase client creator function
require('dotenv').config(); // Load environment variables from .env file

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL ;
const supabaseKey = process.env.SUPABASE_KEY ;

// Create Supabase client instance
const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection on startup
supabase
  .from('BUILDING')
  .select('*')
  .limit(1)
  .then(() => console.log('Connected to Supabase database'))
  .catch(err => console.error('Supabase connection error:', err.message));

module.exports = supabase; // Export the Supabase client so other files can use it