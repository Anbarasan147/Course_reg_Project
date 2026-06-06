package com.coursereg.system.controller;

import com.coursereg.system.dto.CourseDTO;
import com.coursereg.system.model.Course;
import com.coursereg.system.repository.RegistrationRepository;
import com.coursereg.system.model.TimeSlot;
import com.coursereg.system.repository.TimeSlotRepository;
import com.coursereg.system.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @GetMapping("/time-slots")
    public List<TimeSlot> getAllTimeSlots() {
        return timeSlotRepository.findAll();
    }

    @GetMapping
    public List<CourseDTO> getAllCourses() {
        return courseService.getAllCourses().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public CourseDTO getCourseById(@PathVariable Long id) {
        return convertToDTO(courseService.getCourseById(id));
    }

    @PostMapping
    public ResponseEntity<CourseDTO> createCourse(@RequestBody Course course) {
        Course created = courseService.createCourse(course);
        return ResponseEntity.ok(convertToDTO(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDTO> updateCourse(@PathVariable Long id, @RequestBody Course courseDetails) {
        Course updated = courseService.updateCourse(id, courseDetails);
        return ResponseEntity.ok(convertToDTO(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }

    private CourseDTO convertToDTO(Course course) {
        long activeRegs = registrationRepository.countByCourseIdAndStatus(course.getId(), "REGISTERED");
        int remaining = (int) (course.getCapacity() - activeRegs);
        if (remaining < 0) remaining = 0;

        Set<String> prereqs = course.getPrerequisites().stream()
            .map(Course::getCourseCode)
            .collect(Collectors.toSet());

        return new CourseDTO(
            course.getId(),
            course.getCourseCode(),
            course.getTitle(),
            course.getDescription(),
            course.getCredits(),
            course.getCapacity(),
            remaining,
            course.getInstructor(),
            course.getDepartment(),
            course.getTimeSlot(),
            prereqs
        );
    }
}
