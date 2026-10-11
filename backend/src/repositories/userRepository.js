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
              profile_visibility, created_at, updated_at
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
    // Admin view: sort alphabetically by name (case-insensitive), id as stable secondary
    const result = await query(
      'SELECT id, name, email, role, profile_visibility, created_at, updated_at FROM users ORDER BY lower(name) ASC, id ASC'
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
      'experience_level', 'availability_status', 'weekly_capacity_hours',
      'profile_visibility'
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
                 workload_hours, profile_visibility, created_at, updated_at`,
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
  },

  async updateWorkload(userId, workloadHours, client = null) {
    const execute = client ? client.query.bind(client) : query;
    const result = await execute(
      `UPDATE users SET workload_hours = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, workload_hours`,
      [workloadHours, userId]
    );
    return result.rows[0];
  },

  async findAll(requestingUserId = null) {
    // Public profiles only in directory; admins see all
    const result = await query(
      `SELECT id, name, email, role, profile_photo_url, bio, skills,
              experience_level, availability_status, weekly_capacity_hours,
              workload_hours, profile_visibility, created_at, updated_at
       FROM users
       WHERE profile_visibility = 'PUBLIC' OR id = $1
       ORDER BY lower(name) ASC, id ASC`,
      [requestingUserId || 0]
    );
    return result.rows;
  },

  async findAllAdmin() {
    // Admin: see all users regardless of visibility, alphabetically sorted
    const result = await query(
      `SELECT id, name, email, role, profile_photo_url, bio, skills,
              experience_level, availability_status, weekly_capacity_hours,
              workload_hours, profile_visibility, created_at, updated_at
       FROM users ORDER BY lower(name) ASC, id ASC`
    );
    return result.rows;
  },

  async findAllByProject(projectId) {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.profile_photo_url, u.bio, u.skills,
              u.experience_level, u.availability_status, u.weekly_capacity_hours,
              u.workload_hours, u.created_at, u.updated_at
       FROM users u
       INNER JOIN project_members pm ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY u.name ASC`,
      [projectId]
    );
    return result.rows;
  }
};
