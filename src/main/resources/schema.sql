-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS student_completed_courses;
DROP TABLE IF EXISTS course_prerequisites;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- Users table (Base authentication table for both students and admins)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
);

-- Students table (Extends users table for student specific fields)
CREATE TABLE students (
    user_id BIGINT PRIMARY KEY,
    major VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Time Slots table
CREATE TABLE time_slots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- e.g., "MWF 9:00 - 10:00 AM"
    day_of_week VARCHAR(50) NOT NULL, -- e.g., "MONDAY,WEDNESDAY,FRIDAY"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Courses table
CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    credits INT NOT NULL,
    capacity INT NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    time_slot_id BIGINT,
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE SET NULL
);

-- Course Prerequisites join table (A course can have multiple prerequisite courses)
CREATE TABLE course_prerequisites (
    course_id BIGINT NOT NULL,
    prerequisite_id BIGINT NOT NULL,
    PRIMARY KEY (course_id, prerequisite_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Student Completed Courses (To check prerequisites)
CREATE TABLE student_completed_courses (
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Registrations table
CREATE TABLE registrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- e.g., "REGISTERED", "DROPPED"
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
