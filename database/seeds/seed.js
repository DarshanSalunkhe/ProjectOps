import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../.env.local')
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...\n');

    // Check if users already exist
    const userCheck = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Admin User', 'admin@projectops.com', adminPassword, 'ADMIN']
    );
    console.log('✓ Created admin user (email: admin@projectops.com, password: admin123)');

    // Create regular users
    const member1Password = await bcrypt.hash('password123', 10);
    const member1Result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['John Doe', 'john@projectops.com', member1Password, 'MEMBER']
    );

    const member2Password = await bcrypt.hash('password123', 10);
    const member2Result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Jane Smith', 'jane@projectops.com', member2Password, 'MEMBER']
    );
    console.log('✓ Created 2 team members');

    // Create sample project
    const projectResult = await pool.query(
      `INSERT INTO projects (name, description, goal, status, start_date, deadline, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'ProjectOps Development',
        'Build the autonomous project management system',
        'Create a fully functional project management platform with AI-powered features',
        'ACTIVE',
        new Date(),
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        adminResult.rows[0].id
      ]
    );
    console.log('✓ Created sample project');

    // Create sample tasks
    const task1Result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, estimated_hours, deadline, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        projectResult.rows[0].id,
        'Design database schema',
        'Create PostgreSQL schema for all entities',
        'COMPLETED',
        'HIGH',
        8,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        adminResult.rows[0].id
      ]
    );

    const task2Result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, estimated_hours, deadline, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        projectResult.rows[0].id,
        'Implement authentication',
        'Build JWT-based authentication system',
        'IN_PROGRESS',
        'HIGH',
        12,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        adminResult.rows[0].id
      ]
    );

    const task3Result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, estimated_hours, deadline, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        projectResult.rows[0].id,
        'Build project management API',
        'Create CRUD endpoints for projects',
        'TODO',
        'MEDIUM',
        10,
        new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        adminResult.rows[0].id
      ]
    );

    console.log('✓ Created 3 sample tasks');

    // Assign tasks
    await pool.query(
      'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
      [task1Result.rows[0].id, adminResult.rows[0].id]
    );

    await pool.query(
      'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
      [task2Result.rows[0].id, member1Result.rows[0].id]
    );

    await pool.query(
      'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
      [task3Result.rows[0].id, member2Result.rows[0].id]
    );

    console.log('✓ Assigned tasks to users');

    // Create task dependency
    await pool.query(
      'INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type) VALUES ($1, $2, $3)',
      [task3Result.rows[0].id, task2Result.rows[0].id, 'BLOCKS']
    );

    console.log('✓ Created task dependencies');

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nSample credentials:');
    console.log('  Admin: admin@projectops.com / admin123');
    console.log('  User1: john@projectops.com / password123');
    console.log('  User2: jane@projectops.com / password123');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seedDatabase();
