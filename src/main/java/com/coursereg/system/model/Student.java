package com.coursereg.system.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "students")
public class Student {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.EAGER)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String major;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "student_completed_courses",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> completedCourses = new HashSet<>();

    public Student() {}

    public Student(User user, String major) {
        this.user = user;
        this.userId = user.getId();
        this.major = major;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
        if (user != null) {
            this.userId = user.getId();
        }
    }

    public String getMajor() {
        return major;
    }

    public void setMajor(String major) {
        this.major = major;
    }

    public Set<Course> getCompletedCourses() {
        return completedCourses;
    }

    public void setCompletedCourses(Set<Course> completedCourses) {
        this.completedCourses = completedCourses;
    }
}
