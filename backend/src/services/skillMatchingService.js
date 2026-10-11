import { skillRepository } from '../repositories/skillRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';

const PROFICIENCY_VALUES = {
  'BEGINNER': 1,
  'INTERMEDIATE': 2,
  'ADVANCED': 3,
  'EXPERT': 4
};

export const skillMatchingService = {
  /**
   * Find best matches for a task based on required skills
   * @param {number} taskId - Task ID
   * @returns {Promise<Array>} - Ranked list of users with match scores
   */
  async findBestMatchesForTask(taskId, options = {}) {
    const { limit = 10, availableOnly = false } = options;
    const task = await taskRepository.findById(taskId);
    if (!task) return [];
    const allUsers = await userRepository.findAllByProject(task.project_id);

    // Get required skills for the task
    const requiredSkills = await skillRepository.getTaskSkills(taskId);

    if (requiredSkills.length === 0) {
      // No skills required, return available users
      return allUsers
        .filter(u => !availableOnly || (u.availability_status === 'AVAILABLE' && Number(u.workload_hours || 0) < Number(u.weekly_capacity_hours || 40)))
        .map(u => ({
          user: u,
          match_score: 0,
          explanation: 'No specific skills required',
          matching_skills: [],
          missing_skills: [],
          capacity_score: Math.max(0, 100 - Math.round((Number(u.workload_hours || 0) / Number(u.weekly_capacity_hours || 40)) * 100)),
          available_hours: Math.max(0, Number(u.weekly_capacity_hours || 40) - Number(u.workload_hours || 0))
        }))
        .slice(0, limit);
    }

    // For each user, calculate match score
    const matches = [];

    for (const user of allUsers) {
      // Skip if only available users wanted and user is not available
      if (availableOnly && (user.availability_status !== 'AVAILABLE' || Number(user.workload_hours || 0) >= Number(user.weekly_capacity_hours || 40))) {
        continue;
      }

      // Get user's skills
      const userSkills = await skillRepository.findByUser(user.id);
      const userSkillMap = {};
      userSkills.forEach(skill => {
        userSkillMap[skill.skill_name] = skill.proficiency_level;
      });

      // Calculate match
      let totalScore = 0;
      let maxScore = 0;
      const matchingSkills = [];
      const missingSkills = [];

      for (const reqSkill of requiredSkills) {
        const weight = reqSkill.is_mandatory ? 2 : 1;
        const requiredLevel = PROFICIENCY_VALUES[reqSkill.required_proficiency];
        maxScore += (requiredLevel * weight);

        const userProficiency = userSkillMap[reqSkill.skill_name];

        if (userProficiency) {
          const userLevel = PROFICIENCY_VALUES[userProficiency];
          
          if (userLevel >= requiredLevel) {
            // User meets or exceeds requirement
            totalScore += (userLevel * weight);
            matchingSkills.push({
              skill: reqSkill.skill_name,
              required: reqSkill.required_proficiency,
              actual: userProficiency,
              match: userLevel === requiredLevel ? 'exact' : 'exceeds'
            });
          } else {
            // User has skill but below required level
            totalScore += (userLevel * weight * 0.5); // Partial credit
            matchingSkills.push({
              skill: reqSkill.skill_name,
              required: reqSkill.required_proficiency,
              actual: userProficiency,
              match: 'below'
            });
          }
        } else {
          // User doesn't have the skill
          missingSkills.push({
            skill: reqSkill.skill_name,
            required: reqSkill.required_proficiency,
            mandatory: reqSkill.is_mandatory
          });
        }
      }

      const matchScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      // Consider availability and workload
      const capacity = Number(user.weekly_capacity_hours || 40);
      const workload = Number(user.workload_hours || 0);
      const capacityScore = capacity > 0
        ? Math.max(0, 100 - Math.round((workload / capacity) * 100))
        : 0;

      // Combine skill match and capacity
      const finalScore = Math.round(matchScore * 0.7 + capacityScore * 0.3);

      // Build explanation
      const explanation = this._buildExplanation(matchingSkills, missingSkills, user, capacityScore);

      matches.push({
        user,
        match_score: finalScore,
        skill_match_score: matchScore,
        capacity_score: capacityScore,
        explanation,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        available_hours: Math.max(0, capacity - workload)
      });
    }

    // Sort by match score descending
    matches.sort((a, b) => b.match_score - a.match_score);

    return matches.slice(0, limit);
  },

  /**
   * Detect skill gaps for a task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Skill gap analysis
   */
  async detectSkillGaps(taskId) {
    const requiredSkills = await skillRepository.getTaskSkills(taskId);

    if (requiredSkills.length === 0) {
      return {
        has_gaps: false,
        message: 'No skills required for this task',
        gaps: []
      };
    }

    const gaps = [];

    for (const reqSkill of requiredSkills) {
      // Find users with this skill at required level or higher
      const qualifiedUsers = await skillRepository.findUsersWithSkill(
        reqSkill.skill_name,
        reqSkill.required_proficiency
      );

      // Filter for available users with capacity
      const availableQualified = qualifiedUsers.filter(u => 
        u.availability_status === 'AVAILABLE' &&
        (u.workload_hours < u.weekly_capacity_hours)
      );

      if (qualifiedUsers.length === 0) {
        gaps.push({
          skill: reqSkill.skill_name,
          required_level: reqSkill.required_proficiency,
          severity: reqSkill.is_mandatory ? 'CRITICAL' : 'WARNING',
          issue: 'NO_ONE_HAS_SKILL',
          message: `No team member has ${reqSkill.skill_name} at ${reqSkill.required_proficiency} level`,
          qualified_count: 0,
          available_count: 0
        });
      } else if (availableQualified.length === 0) {
        gaps.push({
          skill: reqSkill.skill_name,
          required_level: reqSkill.required_proficiency,
          severity: reqSkill.is_mandatory ? 'HIGH' : 'MEDIUM',
          issue: 'NO_AVAILABLE_QUALIFIED',
          message: `${qualifiedUsers.length} team member(s) have the skill but none are available`,
          qualified_count: qualifiedUsers.length,
          available_count: 0,
          qualified_users: qualifiedUsers.map(u => ({ id: u.id, name: u.name, status: u.availability_status }))
        });
      }
    }

    return {
      has_gaps: gaps.length > 0,
      gap_count: gaps.length,
      critical_gaps: gaps.filter(g => g.severity === 'CRITICAL').length,
      gaps
    };
  },

  /**
   * Detect workspace-wide skill gaps
   * @returns {Promise<Object>} - Workspace skill analysis
   */
  async detectWorkspaceSkillGaps() {
    const allSkills = await skillRepository.getAllSkills();
    
    // Identify skills with low coverage or low proficiency
    const gaps = [];

    for (const skill of allSkills) {
      if (skill.user_count === 1) {
        gaps.push({
          skill: skill.skill_name,
          issue: 'SINGLE_POINT_OF_FAILURE',
          severity: 'MEDIUM',
          message: `Only one person has ${skill.skill_name}`,
          user_count: 1
        });
      }

      if (skill.avg_proficiency < 2) { // Below INTERMEDIATE
        gaps.push({
          skill: skill.skill_name,
          issue: 'LOW_PROFICIENCY',
          severity: 'LOW',
          message: `Team average proficiency in ${skill.skill_name} is low`,
          avg_proficiency: skill.avg_proficiency,
          user_count: skill.user_count
        });
      }
    }

    return {
      total_skills: allSkills.length,
      has_gaps: gaps.length > 0,
      gaps,
      skills: allSkills
    };
  },

  _buildExplanation(matchingSkills, missingSkills, user, capacityScore) {
    const parts = [];

    if (matchingSkills.length > 0) {
      const exactMatches = matchingSkills.filter(s => s.match === 'exact' || s.match === 'exceeds').length;
      if (exactMatches > 0) {
        parts.push(`Meets ${exactMatches}/${matchingSkills.length + missingSkills.length} skill requirements`);
      } else {
        parts.push(`Partial skill match (${matchingSkills.length} skills below required level)`);
      }
    }

    if (missingSkills.length > 0) {
      const mandatory = missingSkills.filter(s => s.mandatory).length;
      if (mandatory > 0) {
        parts.push(`Missing ${mandatory} mandatory skill(s)`);
      } else {
        parts.push(`Missing ${missingSkills.length} optional skill(s)`);
      }
    }

    if (user.availability_status !== 'AVAILABLE') {
      parts.push(`Currently ${user.availability_status}`);
    }

    if (capacityScore < 30) {
      parts.push(`Near capacity (${Math.round((user.workload_hours / user.weekly_capacity_hours) * 100)}% utilized)`);
    } else if (capacityScore > 70) {
      parts.push(`Good availability (${user.weekly_capacity_hours - user.workload_hours}h free)`);
    }

    return parts.join('; ');
  }
};
