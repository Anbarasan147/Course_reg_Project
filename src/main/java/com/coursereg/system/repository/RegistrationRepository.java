package com.coursereg.system.repository;

import com.coursereg.system.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudentUserIdAndStatus(Long studentId, String status);

    Optional<Registration> findByStudentUserIdAndCourseIdAndStatus(Long studentId, Long courseId, String status);

    long countByCourseIdAndStatus(Long courseId, String status);

    boolean existsByStudentUserIdAndCourseIdAndStatus(Long studentId, Long courseId, String status);
}
