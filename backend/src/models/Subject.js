const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Subject {
  static async create(name, type, semester, weeklyLectureCount = 0, credits = 0) {
    const id = uuidv4();
    // Auto-generate code from name (first 3 letters + semester)
    const code = name.substring(0, 3).toUpperCase() + semester;
    const query = `
      INSERT INTO subjects (subject_id, name, code, type, semester, weekly_lecture_count, credits)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await pool.query(query, [id, name, code, type, semester, weeklyLectureCount, credits]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `SELECT * FROM subjects WHERE subject_id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findBySemester(semester) {
    const query = `SELECT * FROM subjects WHERE semester = $1 ORDER BY name;`;
    const result = await pool.query(query, [semester]);
    return result.rows;
  }

  static async findAll() {
    const query = `
      SELECT s.*, 
        json_agg(DISTINCT json_build_object('branch_id', b.branch_id, 'branch_name', b.name)) 
        FILTER (WHERE b.branch_id IS NOT NULL) as branches,
        json_agg(DISTINCT json_build_object('professor_id', p.professor_id, 'professor_name', p.name)) 
        FILTER (WHERE p.professor_id IS NOT NULL) as professors
      FROM subjects s
      LEFT JOIN subjects_branches sb ON s.subject_id = sb.subject_id
      LEFT JOIN branches b ON sb.branch_id = b.branch_id
      LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
      LEFT JOIN professors p ON ps.professor_id = p.professor_id
      GROUP BY s.subject_id
      ORDER BY s.semester, s.name;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, name, type, semester, weeklyLectureCount, credits) {
    const query = `
      UPDATE subjects 
      SET name = $2, type = $3, semester = $4, 
          weekly_lecture_count = $5, credits = $6, updated_at = CURRENT_TIMESTAMP
      WHERE subject_id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [id, name, type, semester, weeklyLectureCount, credits]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `DELETE FROM subjects WHERE subject_id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getBranches(subjectId) {
    const query = `
      SELECT b.* FROM branches b
      INNER JOIN subjects_branches sb ON b.branch_id = sb.branch_id
      WHERE sb.subject_id = $1 AND sb.is_applicable = TRUE;
    `;
    const result = await pool.query(query, [subjectId]);
    return result.rows;
  }

  static async getProfessors(subjectId) {
    const query = `
      SELECT p.* FROM professors p
      INNER JOIN professors_subjects ps ON p.professor_id = ps.professor_id
      WHERE ps.subject_id = $1;
    `;
    const result = await pool.query(query, [subjectId]);
    return result.rows;
  }
}

module.exports = Subject;
