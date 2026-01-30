-- SmartTT Database Schema
-- PostgreSQL Database: smarttt (lowercase)

-- Create database if it doesn't exist (comment out if already created)
-- CREATE DATABASE smarttt;

-- Connect to the database
\c smarttt

-- Drop existing tables if needed (for fresh setup)
DROP TABLE IF EXISTS student_feedback CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS professors_subjects CASCADE;
DROP TABLE IF EXISTS subjects_branches CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS professors CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;

-- ===== BRANCHES TABLE =====
CREATE TABLE branches (
  branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== PROFESSORS TABLE =====
CREATE TABLE professors (
  professor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== SUBJECTS TABLE =====
CREATE TABLE subjects (
  subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20),
  type VARCHAR(50) NOT NULL CHECK (type IN ('THEORY', 'LAB', 'BOTH')),
  semester INT NOT NULL CHECK (semester >= 1 AND semester <= 8),
  weekly_lecture_count INT DEFAULT 0,
  weekly_lab_count INT DEFAULT 0,
  credits DECIMAL(3,1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== SUBJECTS_BRANCHES MAPPING TABLE =====
CREATE TABLE subjects_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  is_applicable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subject_id, branch_id)
);

-- ===== PROFESSORS_SUBJECTS MAPPING TABLE =====
CREATE TABLE professors_subjects (
  mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professors(professor_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(professor_id, subject_id)
);

-- ===== BATCHES TABLE =====
CREATE TABLE batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  batch_number INT NOT NULL CHECK (batch_number IN (1, 2)),
  semester INT NOT NULL CHECK (semester >= 1 AND semester <= 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(branch_id, batch_number, semester)
);

-- ===== TIME SLOTS TABLE =====
CREATE TABLE time_slots (
  slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  slot_label VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TIMETABLE TABLE =====
CREATE TABLE timetable (
  timetable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester INT NOT NULL CHECK (semester >= 1 AND semester <= 8),
  branch_id UUID NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(batch_id) ON DELETE SET NULL,
  professor_id UUID REFERENCES professors(professor_id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(subject_id) ON DELETE SET NULL,
  day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('MON', 'TUE', 'WED', 'THU', 'FRI')),
  time_slot_start TIME NOT NULL,
  time_slot_end TIME NOT NULL,
  slot_type VARCHAR(50) NOT NULL CHECK (slot_type IN ('THEORY', 'LAB', 'LIBRARY', 'BREAK', 'RECESS', 'PROJECT')),
  room_id VARCHAR(50),
  lab_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INT DEFAULT 1
);

-- ===== ASSIGNMENTS TABLE =====
CREATE TABLE assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professors(professor_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('TEXT', 'PDF', 'LINK', 'IMAGE')),
  content_url VARCHAR(500),
  content_text TEXT,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== STUDENT FEEDBACK TABLE =====
CREATE TABLE student_feedback (
  feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  semester INT NOT NULL,
  feedback_text TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX idx_professors_email ON professors(email);
CREATE INDEX idx_subjects_semester ON subjects(semester);
CREATE INDEX idx_timetable_semester_branch ON timetable(semester, branch_id);
CREATE INDEX idx_timetable_professor ON timetable(professor_id);
CREATE INDEX idx_timetable_day_time ON timetable(day_of_week, time_slot_start);
CREATE INDEX idx_assignments_professor ON assignments(professor_id);
CREATE INDEX idx_assignments_subject ON assignments(subject_id);
CREATE INDEX idx_professors_subjects ON professors_subjects(professor_id, subject_id);
CREATE INDEX idx_subjects_branches ON subjects_branches(subject_id, branch_id);

-- ===== INITIAL DATA =====

-- Insert Branches
INSERT INTO branches (name, code) VALUES
('Computer Science and Engineering', 'CSE'),
('Electronics and Communication Engineering', 'ECE'),
('Mechanical Engineering', 'MECH'),
('Civil Engineering', 'CIVIL'),
('Electrical Engineering', 'EE');

-- Insert Time Slots (Pre-defined slots)
INSERT INTO time_slots (start_time, end_time, duration_minutes, slot_label) VALUES
('09:00:00', '10:00:00', 60, '9:00-10:00'),
('10:00:00', '11:00:00', 60, '10:00-11:00'),
('11:00:00', '12:00:00', 60, '11:00-12:00'),
('12:00:00', '12:45:00', 45, 'RECESS'),
('12:45:00', '13:00:00', 15, 'TEA BREAK'),
('13:00:00', '14:00:00', 60, '1:00-2:00'),
('14:00:00', '15:00:00', 60, '2:00-3:00'),
('15:00:00', '16:00:00', 60, '3:00-4:00'),
('16:00:00', '17:00:00', 60, '4:00-5:00');

COMMIT;
