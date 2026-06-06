package com.coursereg.system.service;

import com.coursereg.system.exception.CourseFullException;
import com.coursereg.system.exception.PrerequisiteNotMetException;
import com.coursereg.system.exception.ResourceNotFoundException;
import com.coursereg.system.exception.ScheduleConflictException;
import com.coursereg.system.model.Course;
import com.coursereg.system.model.Registration;
import com.coursereg.system.model.Student;
import com.coursereg.system.repository.CourseRepository;
import com.coursereg.system.repository.RegistrationRepository;
import com.coursereg.system.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistrationService {

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    public List<Registration> getActiveRegistrationsByStudent(Long studentId) {
        return registrationRepository.findByStudentUserIdAndStatus(studentId, "REGISTERED");
    }

    public long getActiveRegistrationCount(Long courseId) {
        return registrationRepository.countByCourseIdAndStatus(courseId, "REGISTERED");
    }

    @Transactional
    public Registration registerStudentForCourse(Long studentId, Long courseId) {
        // 1. Retrieve the student profile
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for ID: " + studentId));

        // 2. Fetch the course with a PESSIMISTIC_WRITE lock to block concurrent registration threads
        Course course = courseRepository.findByIdForUpdate(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + courseId));

        // 3. Prevent duplicate active registrations
        if (registrationRepository.existsByStudentUserIdAndCourseIdAndStatus(studentId, courseId, "REGISTERED")) {
            throw new ScheduleConflictException("You are already registered for course: " + course.getCourseCode());
        }

        // 4. Prerequisite Check
        for (Course prereq : course.getPrerequisites()) {
            boolean hasCompleted = student.getCompletedCourses().stream()
                .anyMatch(c -> c.getId().equals(prereq.getId()));
            if (!hasCompleted) {
                throw new PrerequisiteNotMetException("Cannot register. Prerequisite '" 
                    + prereq.getCourseCode() + " - " + prereq.getTitle() + "' is not completed.");
            }
        }

        // 5. Time-Slot Conflict Detection
        if (course.getTimeSlot() != null) {
            List<Registration> currentRegistrations = registrationRepository.findByStudentUserIdAndStatus(studentId, "REGISTERED");
            for (Registration reg : currentRegistrations) {
                Course registeredCourse = reg.getCourse();
                if (registeredCourse.getTimeSlot() != null && 
                    registeredCourse.getTimeSlot().getId().equals(course.getTimeSlot().getId())) {
                    throw new ScheduleConflictException("Schedule conflict: " + course.getCourseCode() 
                        + " shares the same time slot [" + course.getTimeSlot().getName() + "] with already registered " 
                        + registeredCourse.getCourseCode() + ".");
                }
            }
        }

        // 6. Capacity Safe Check
        long activeCount = registrationRepository.countByCourseIdAndStatus(courseId, "REGISTERED");
        if (activeCount >= course.getCapacity()) {
            throw new CourseFullException("Registration failed. Course " + course.getCourseCode() + " is full (capacity: " + course.getCapacity() + ").");
        }

        // 7. Save registration
        // Check if there is an existing DROPPED entry we can recycle
        Registration registration = registrationRepository
            .findByStudentUserIdAndCourseIdAndStatus(studentId, courseId, "DROPPED")
            .orElse(null);

        if (registration != null) {
            registration.setStatus("REGISTERED");
            registration.setRegistrationDate(LocalDateTime.now());
        } else {
            registration = new Registration(student, course, "REGISTERED");
        }

        return registrationRepository.save(registration);
    }

    @Transactional
    public void dropCourse(Long studentId, Long courseId) {
        Registration registration = registrationRepository
            .findByStudentUserIdAndCourseIdAndStatus(studentId, courseId, "REGISTERED")
            .orElseThrow(() -> new ResourceNotFoundException("No active registration found for student " + studentId + " in course " + courseId));

        registration.setStatus("DROPPED");
        registrationRepository.save(registration);
    }
}
