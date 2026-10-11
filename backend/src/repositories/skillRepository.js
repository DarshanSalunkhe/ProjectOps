import { query } from '../config/database.js';

export const skillRepository = {
  /**
   * Get all skills for a user
   */
  async findByUser(userId) {
    const result = await query(
      `SELECT id, skill_name, proficiency_level, years_experience, created_at, updated_at
       FROM user_skills
       WHERE user_id = $1
       ORDER BY proficiency_level DESC, skill_name ASC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Add or update a skill for a user
   */
  async upsertUserSkill(userId, skillName, proficiencyLevel, yearsExperience = 0) {
    const normalizedSkill = skillName.toLowerCase().trim();
    
    const result = await query(
      `INSERT INTO user_skills (user_id, skill_name, proficiency_level, years_experience)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, skill_name)
       DO UPDATE SET 
         proficiency_level = EXCLUDED.proficiency_level,
         years_experience = EXCLUDED.years_experience,
         updated_at = NOW()
       RETURNING *`,
      [userId, normalizedSkill, proficiencyLevel, yearsExperience]
    );
    return result.rows[0];
  },

  /**
   * Remove a skill from a user
   */
  async deleteUserSkill(userId, skillName) {
    const normalizedSkill = skillName.toLowerCase().trim();
    
    const result = await query(
      `DELETE FROM user_skills
       WHERE user_id = $1 AND skill_name = $2
       RETURNING *`,
      [userId, normalizedSkill]
    );
    return result.rows[0];
  },

  /**
   * Get all unique skills across workspace
   */
  async getAllSkills() {
    const result = await query(
      `SELECT DISTINCT skill_name, 
              COUNT(*) as user_count,
              AVG(CASE proficiency_level
                WHEN 'BEGINNER' THEN 1
                WHEN 'INTERMEDIATE' THEN 2
                WHEN 'ADVANCED' THEN 3
                WHEN 'EXPERT' THEN 4
              END) as avg_proficiency
       FROM user_skills
       GROUP BY skill_name
       ORDER BY user_count DESC, skill_name ASC`
    );
    return result.rows;
  },

  /**
   * Find users with a specific skill
   */
  async findUsersWithSkill(skillName, minProficiency = 'BEGINNER') {
    const normalizedSkill = skillName.toLowerCase().trim();
    const proficiencyOrder = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3, 'EXPERT': 4 };
    const minLevel = proficiencyOrder[minProficiency] || 1;

    const result = await query(
      `SELECT 
         u.id, u.name, u.email, u.availability_status, u.weekly_capacity_hours, u.workload_hours,
         us.skill_name, us.proficiency_level, us.years_experience
       FROM user_skills us
       INNER JOIN users u ON us.user_id = u.id
       WHERE us.skill_name = $1
       AND CASE us.proficiency_level
           WHEN 'BEGINNER' THEN 1
           WHEN 'INTERMEDIATE' THEN 2
           WHEN 'ADVANCED' THEN 3
           WHEN 'EXPERT' THEN 4
           END >= $2
       ORDER BY us.proficiency_level DESC, u.availability_status ASC`,
      [normalizedSkill, minLevel]
    );
    return result.rows;
  },

  /**
   * Get required skills for a task
   */
  async getTaskSkills(taskId) {
    const result = await query(
      `SELECT id, skill_name, required_proficiency, is_mandatory
       FROM task_required_skills
       WHERE task_id = $1
       ORDER BY is_mandatory DESC, required_proficiency DESC, skill_name ASC`,
      [taskId]
    );
    return result.rows;
  },

  /**
   * Add required skill to task
   */
  async addTaskSkill(taskId, skillName, requiredProficiency, isMandatory = true, client) {
    const normalizedSkill = skillName.toLowerCase().trim();
    
    const execute = client ? client.query.bind(client) : query;
    const result = await execute(
      `INSERT INTO task_required_skills (task_id, skill_name, required_proficiency, is_mandatory)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (task_id, skill_name)
       DO UPDATE SET 
         required_proficiency = EXCLUDED.required_proficiency,
         is_mandatory = EXCLUDED.is_mandatory
       RETURNING *`,
      [taskId, normalizedSkill, requiredProficiency, isMandatory]
    );
    return result.rows[0];
  },

  /**
   * Remove required skill from task
   */
  async removeTaskSkill(taskId, skillName) {
    const normalizedSkill = skillName.toLowerCase().trim();
    
    const result = await query(
      `DELETE FROM task_required_skills
       WHERE task_id = $1 AND skill_name = $2
       RETURNING *`,
      [taskId, normalizedSkill]
    );
    return result.rows[0];
  }
};
