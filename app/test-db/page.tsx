'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DatabaseTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabaseConnection = async () => {
    setTestResults([]);
    addResult('Starting database connection test...');

    try {
      // Test 1: Check if we can connect to Supabase
      addResult('Testing Supabase connection...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addResult(`❌ Session error: ${sessionError.message}`);
        return;
      }
      addResult(`✅ Supabase connection successful. User: ${session?.user?.email || 'Not logged in'}`);

      // Test 2: Check if polls table exists
      addResult('Testing polls table...');
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('count')
        .limit(1);

      if (pollsError) {
        addResult(`❌ Polls table error: ${pollsError.message}`);
        addResult('💡 This suggests the database schema needs to be set up. Check the database_schema.sql file.');
      } else {
        addResult(`✅ Polls table exists. Count: ${pollsData?.length || 0}`);
      }

      // Test 3: Check if poll_options table exists
      addResult('Testing poll_options table...');
      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select('count')
        .limit(1);

      if (optionsError) {
        addResult(`❌ Poll_options table error: ${optionsError.message}`);
      } else {
        addResult(`✅ Poll_options table exists. Count: ${optionsData?.length || 0}`);
      }

      // Test 4: Check if votes table exists
      addResult('Testing votes table...');
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('count')
        .limit(1);

      if (votesError) {
        addResult(`❌ Votes table error: ${votesError.message}`);
      } else {
        addResult(`✅ Votes table exists. Count: ${votesData?.length || 0}`);
      }

      addResult('Database test completed!');

    } catch (error) {
      addResult(`❌ Unexpected error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <button 
        onClick={testDatabaseConnection}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Run Database Test
      </button>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Test Results:</h2>
        <div className="space-y-1">
          {testResults.map((result, index) => (
            <div key={index} className="font-mono text-sm">
              {result}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Next Steps:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Run the database test above to see what's missing</li>
          <li>If tables don't exist, go to your Supabase dashboard</li>
          <li>Navigate to the SQL Editor</li>
          <li>Copy and paste the contents of <code>database_schema.sql</code></li>
          <li>Execute the SQL to create the required tables</li>
          <li>Refresh this page and test again</li>
        </ol>
      </div>
    </div>
  );
}
