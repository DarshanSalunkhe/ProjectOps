/**
 * Quick Endpoint Test Script
 * Tests critical intelligence endpoints
 */

const API_BASE = 'http://localhost:5000/api';

// Mock authentication token (replace with real token when testing)
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: `${API_BASE}/health`,
    requiresAuth: false
  },
  {
    name: 'Generate AI Plan',
    method: 'POST',
    url: `${API_BASE}/ai/planner/generate`,
    requiresAuth: true,
    body: {
      goal: 'Build a task management application',
      description: 'Web-based task tracker with team collaboration',
      deadline: '2027-01-01',
      teamSize: 4,
      techStack: ['React', 'Node.js', 'PostgreSQL']
    }
  },
  {
    name: 'Get Project Health',
    method: 'GET',
    url: `${API_BASE}/intelligence/health/1`,
    requiresAuth: true,
    note: 'Replace projectId=1 with actual project ID'
  },
  {
    name: 'Detect Risks',
    method: 'GET',
    url: `${API_BASE}/intelligence/risks/1`,
    requiresAuth: true,
    note: 'Replace projectId=1 with actual project ID'
  },
  {
    name: 'Analyze Impact',
    method: 'POST',
    url: `${API_BASE}/intelligence/impact/1`,
    requiresAuth: true,
    body: { delayDays: 2 },
    note: 'Replace taskId=1 with actual task ID'
  },
  {
    name: 'Generate Replan',
    method: 'POST',
    url: `${API_BASE}/intelligence/replan/1`,
    requiresAuth: true,
    body: {
      problem: {
        type: 'TASK_DELAY',
        taskId: 1,
        delayDays: 2
      }
    },
    note: 'Replace projectId=1 and taskId=1 with actual IDs'
  },
  {
    name: 'Get Skill Matches',
    method: 'GET',
    url: `${API_BASE}/tasks/1/skill-matches`,
    requiresAuth: true,
    note: 'Replace taskId=1 with actual task ID'
  },
  {
    name: 'Get Dependency Graph',
    method: 'GET',
    url: `${API_BASE}/projects/1/dependencies/graph`,
    requiresAuth: true,
    note: 'Replace projectId=1 with actual project ID'
  }
];

async function runTest(test) {
  try {
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (test.requiresAuth) {
      if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
        console.log(`⚠️  ${test.name}: SKIPPED (no auth token)`);
        return;
      }
      options.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    if (test.body) {
      options.body = JSON.stringify(test.body);
    }

    const response = await fetch(test.url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✓ ${test.name}: SUCCESS`);
      if (test.note) console.log(`  Note: ${test.note}`);
    } else {
      console.log(`✗ ${test.name}: FAILED`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Error: ${data.message || data.error || 'Unknown'}`);
    }
  } catch (error) {
    console.log(`✗ ${test.name}: ERROR`);
    console.log(`  ${error.message}`);
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════');
  console.log('  ProjectOps Endpoint Test Suite');
  console.log('═══════════════════════════════════════\n');

  for (const test of tests) {
    await runTest(test);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('Test Suite Complete');
  console.log('═══════════════════════════════════════\n');
  console.log('To run authenticated tests:');
  console.log('1. Login and get JWT token');
  console.log('2. Replace AUTH_TOKEN in this script');
  console.log('3. Run: node test-endpoints.js\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
