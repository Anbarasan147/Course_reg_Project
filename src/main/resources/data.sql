-- Clear tables (just in case)
DELETE FROM registrations;
DELETE FROM student_completed_courses;
DELETE FROM course_prerequisites;
DELETE FROM courses;
DELETE FROM time_slots;
DELETE FROM students;
DELETE FROM users;

-- Insert Time Slots
INSERT INTO time_slots (id, name, day_of_week, start_time, end_time) VALUES
(1, 'MWF 09:00 - 10:00 AM', 'MONDAY,WEDNESDAY,FRIDAY', '09:00:00', '10:00:00'),
(2, 'TTh 10:00 - 11:30 AM', 'TUESDAY,THURSDAY', '10:00:00', '11:30:00'),
(3, 'MWF 11:00 - 12:00 PM', 'MONDAY,WEDNESDAY,FRIDAY', '11:00:00', '12:00:00'),
(4, 'TTh 02:00 - 03:30 PM', 'TUESDAY,THURSDAY', '14:00:00', '15:30:00');

-- Insert Courses
-- Note: CS101 and MA101 share the same time slot (1), which will trigger conflict detection.
INSERT INTO courses (id, course_code, title, description, credits, capacity, instructor, department, time_slot_id) VALUES
(1, 'CS101', 'Introduction to Computer Science', 'Basic concepts of computer programming and computer systems using Java.', 3, 30, 'Dr. Alan Turing', 'Computer Science', 1),
(2, 'CS102', 'Data Structures & Algorithms', 'In-depth study of sorting, searching, linked lists, trees, graphs, and algorithmic complexity.', 4, 25, 'Dr. Grace Hopper', 'Computer Science', 2),
(3, 'CS201', 'Database Systems', 'Relational database design, SQL programming, transactions, indexing, and database administration.', 3, 20, 'Dr. Edgar Codd', 'Computer Science', 3),
(4, 'MA101', 'Calculus I', 'Limits, derivatives, integrals, and their applications to physical sciences.', 4, 40, 'Dr. Isaac Newton', 'Mathematics', 1),
(5, 'MA102', 'Linear Algebra', 'Vector spaces, linear transformations, matrices, determinants, and eigenvalues.', 3, 35, 'Dr. Carl Friedrich Gauss', 'Mathematics', 4),
(6, 'CS301', 'Advanced Software Engineering', 'Design patterns, system architecture, testing methodologies, and agile software development.', 3, 5, 'Dr. Margaret Hamilton', 'Computer Science', 4),
(7, 'CS401', 'Quantum Computing', 'Introduction to quantum bits, gates, circuits, and quantum algorithms.', 3, 1, 'Dr. Ada Lovelace', 'Computer Science', 2);

-- Insert Course Prerequisites
-- CS102 requires CS101
-- CS201 requires CS102
-- CS301 requires CS102
INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES
(2, 1),
(3, 2),
(6, 2);

-- Insert Users (Password is BCrypt hash of 'password': $2a$10$r/U9saAifFhiHRMOM8pJ2ewKEP/JHgWR2UJwktcL356ZZS8GQiCU6)
INSERT INTO users (id, name, email, password, role) VALUES
(1, 'System Administrator', 'admin@university.edu', '$2a$10$r/U9saAifFhiHRMOM8pJ2ewKEP/JHgWR2UJwktcL356ZZS8GQiCU6', 'ADMIN'),
(2, 'Alice Smith', 'alice@university.edu', '$2a$10$r/U9saAifFhiHRMOM8pJ2ewKEP/JHgWR2UJwktcL356ZZS8GQiCU6', 'STUDENT'),
(3, 'Bob Johnson', 'bob@university.edu', '$2a$10$r/U9saAifFhiHRMOM8pJ2ewKEP/JHgWR2UJwktcL356ZZS8GQiCU6', 'STUDENT');

-- Insert Students (linking to users table)
INSERT INTO students (user_id, major) VALUES
(2, 'Computer Science'),
(3, 'Mathematics');

-- Insert Student Completed Courses
-- Alice (2) has completed CS101 (1) (meaning she meets the prerequisite for CS102 (2))
-- Bob (3) has completed no courses (meaning he does not meet the prerequisite for CS102 (2))
INSERT INTO student_completed_courses (student_id, course_id) VALUES
(2, 1);
