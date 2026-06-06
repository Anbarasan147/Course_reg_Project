package com.coursereg.system.controller;

import com.coursereg.system.dto.CourseDTO;
import com.coursereg.system.model.Course;
import com.coursereg.system.model.Registration;
import com.coursereg.system.model.User;
import com.coursereg.system.repository.RegistrationRepository;
import com.coursereg.system.repository.UserRepository;
import com.coursereg.system.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @GetMapping
    public ResponseEntity<List<CourseDTO>> getMySchedule() {
        Long studentId = getAuthenticatedUserId();
        List<Registration> regs = registrationService.getActiveRegistrationsByStudent(studentId);
        List<CourseDTO> schedule = regs.stream()
            .map(Registration::getCourse)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(schedule);
    }

    @PostMapping("/register")
    public ResponseEntity<CourseDTO> registerForCourse(@RequestBody Map<String, Long> payload) {
        Long courseId = payload.get("courseId");
        if (courseId == null) {
            return ResponseEntity.badRequest().build();
        }
        Long studentId = getAuthenticatedUserId();
        Registration registration = registrationService.registerStudentForCourse(studentId, courseId);
        return ResponseEntity.ok(convertToDTO(registration.getCourse()));
    }

    @DeleteMapping("/drop/{courseId}")
    public ResponseEntity<?> dropCourse(@PathVariable Long courseId) {
        Long studentId = getAuthenticatedUserId();
        registrationService.dropCourse(studentId, courseId);
        return ResponseEntity.ok().build();
    }

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Logged in user not found in database."));
        return user.getId();
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
