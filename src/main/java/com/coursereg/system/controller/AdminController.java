package com.coursereg.system.controller;

import com.coursereg.system.model.Registration;
import com.coursereg.system.repository.RegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private RegistrationRepository registrationRepository;

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        List<Registration> activeRegs = registrationRepository.findAll().stream()
            .filter(r -> "REGISTERED".equals(r.getStatus()))
            .collect(Collectors.toList());

        // Count unique students who registered
        long totalStudentsRegistered = activeRegs.stream()
            .map(r -> r.getStudent().getUserId())
            .distinct()
            .count();

        // Calculate Revenue ($300 per credit hour registered)
        long totalCredits = activeRegs.stream()
            .mapToLong(r -> r.getCourse().getCredits())
            .sum();
        double revenue = totalCredits * 300.0;

        // Calculate course popularity
        Map<String, Long> popularMap = activeRegs.stream()
            .collect(Collectors.groupingBy(r -> r.getCourse().getCourseCode() + " - " + r.getCourse().getTitle(), Collectors.counting()));

        List<Map<String, Object>> popularCourses = popularMap.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(5)
            .map(entry -> {
                Map<String, Object> item = new HashMap<>();
                item.put("courseName", entry.getKey());
                item.put("registrations", entry.getValue());
                return item;
            })
            .collect(Collectors.toList());

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalStudents", totalStudentsRegistered);
        analytics.put("revenue", revenue);
        analytics.put("popularCourses", popularCourses);

        return ResponseEntity.ok(analytics);
    }
}
