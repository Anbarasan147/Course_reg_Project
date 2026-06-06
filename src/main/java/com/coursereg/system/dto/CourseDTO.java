package com.coursereg.system.dto;

import com.coursereg.system.model.TimeSlot;
import java.util.Set;

public class CourseDTO {
    private Long id;
    private String courseCode;
    private String title;
    private String description;
    private Integer credits;
    private Integer capacity;
    private Integer remainingSeats;
    private String instructor;
    private String department;
    private TimeSlot timeSlot;
    private Set<String> prerequisites;

    public CourseDTO() {}

    public CourseDTO(Long id, String courseCode, String title, String description, Integer credits, Integer capacity, Integer remainingSeats, String instructor, String department, TimeSlot timeSlot, Set<String> prerequisites) {
        this.id = id;
        this.courseCode = courseCode;
        this.title = title;
        this.description = description;
        this.credits = credits;
        this.capacity = capacity;
        this.remainingSeats = remainingSeats;
        this.instructor = instructor;
        this.department = department;
        this.timeSlot = timeSlot;
        this.prerequisites = prerequisites;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getRemainingSeats() {
        return remainingSeats;
    }

    public void setRemainingSeats(Integer remainingSeats) {
        this.remainingSeats = remainingSeats;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public TimeSlot getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(TimeSlot timeSlot) {
        this.timeSlot = timeSlot;
    }

    public Set<String> getPrerequisites() {
        return prerequisites;
    }

    public void setPrerequisites(Set<String> prerequisites) {
        this.prerequisites = prerequisites;
    }
}
