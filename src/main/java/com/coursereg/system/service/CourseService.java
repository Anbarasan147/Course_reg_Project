package com.coursereg.system.service;

import com.coursereg.system.exception.ResourceNotFoundException;
import com.coursereg.system.model.Course;
import com.coursereg.system.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
    }

    @Transactional
    public Course createCourse(Course course) {
        // Clear ID to ensure it is created as a new course
        course.setId(null);
        return courseRepository.save(course);
    }

    @Transactional
    public Course updateCourse(Long id, Course courseDetails) {
        Course course = getCourseById(id);
        
        course.setCourseCode(courseDetails.getCourseCode());
        course.setTitle(courseDetails.getTitle());
        course.setDescription(courseDetails.getDescription());
        course.setCredits(courseDetails.getCredits());
        course.setCapacity(courseDetails.getCapacity());
        course.setInstructor(courseDetails.getInstructor());
        course.setDepartment(courseDetails.getDepartment());
        course.setTimeSlot(courseDetails.getTimeSlot());
        course.setPrerequisites(courseDetails.getPrerequisites());

        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        Course course = getCourseById(id);
        courseRepository.delete(course);
    }
}
