-- Create database if not exists
CREATE DATABASE IF NOT EXISTS pubquiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pubquiz;

-- Quiz Sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('waiting', 'active', 'paused', 'finished') DEFAULT 'waiting',
    current_question_id VARCHAR(36) NULL,
    current_round INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) PRIMARY KEY,
    quiz_session_id VARCHAR(36) NOT NULL,
    round_number INT NOT NULL,
    question_number INT NOT NULL,
    type ENUM('multiple_choice', 'open_text', 'sequence') NOT NULL,
    question_text TEXT NOT NULL,
    fun_fact TEXT NULL,
    time_limit INT NULL, -- in seconds
    points INT DEFAULT 1,
    options JSON NULL, -- for multiple choice questions
    correct_answer TEXT NULL,
    sequence_items JSON NULL, -- for sequence questions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    INDEX idx_quiz_session (quiz_session_id),
    INDEX idx_round_question (round_number, question_number)
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(36) PRIMARY KEY,
    quiz_session_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    total_points INT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    INDEX idx_quiz_session (quiz_session_id),
    INDEX idx_points (total_points)
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    team_id VARCHAR(36) NOT NULL,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NULL,
    points_awarded INT DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_question (question_id),
    INDEX idx_team (team_id),
    UNIQUE KEY unique_team_question (team_id, question_id)
);

-- Sequence Answers table (for drag-and-drop questions)
CREATE TABLE IF NOT EXISTS sequence_answers (
    id VARCHAR(36) PRIMARY KEY,
    answer_id VARCHAR(36) NOT NULL,
    item_text VARCHAR(500) NOT NULL,
    position INT NOT NULL,
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
    INDEX idx_answer (answer_id),
    INDEX idx_position (position)
);

-- Quiz Session Events table (for audit trail)
CREATE TABLE IF NOT EXISTS session_events (
    id VARCHAR(36) PRIMARY KEY,
    quiz_session_id VARCHAR(36) NOT NULL,
    event_type ENUM('session_created', 'question_started', 'question_ended', 'round_started', 'round_ended', 'session_ended') NOT NULL,
    event_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    INDEX idx_quiz_session (quiz_session_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);
