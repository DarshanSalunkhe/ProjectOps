import { query } from '../config/database.js';

export const userRepository = {
  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT id, name, email, role, google_id,
              profile_photo_url, bio, skills, experience_level,
              availability_status, weekly_capacity_hours, workload_hours,
              created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create(name, email, passwordHash, role = 'PROJECT_OWNER') {
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, passwordHash, role]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await query(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, email, role, created_at, updated_at`,
      values
    );
    return result.rows[0];
  },

  // Google OAuth methods
  async findByGoogleId(googleId) {
    const result = await query(
      `SELECT id, name, email, role, google_id,
              profile_photo_url, bio, skills, experience_level,
              availability_status, weekly_capacity_hours, workload_hours,
              created_at, updated_at
       FROM users WHERE google_id = $1`,
      [googleId]
    );
    return result.rows[0];
  },

  async createGoogleUser(googleId, name, email, role = 'PROJECT_OWNER') {
    const result = await query(
      `INSERT INTO users (name, email, google_id, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, google_id, created_at, updated_at`,
      [name, email, googleId, role]
    );
    return result.rows[0];
  },

  async updateProfile(id, updates) {
    const allowedFields = [
      'name', 'email', 'profile_photo_url', 'bio', 'skills',
      'experience_level', 'availability_status', 'weekly_capacity_hours'
    ];

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, name, email, role, profile_photo_url, bio, skills,
                 experience_level, availability_status, weekly_capacity_hours,
                 workload_hours, created_at, updated_at`,
      values
    );
    return result.rows[0];
  },

  async updateRole(userId, role) {
    const result = await query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, created_at, updated_at`,
      [role, userId]
    );
    return result.rows[0];
  }
};
