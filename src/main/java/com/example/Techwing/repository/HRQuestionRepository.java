package com.example.Techwing.repository;

import com.example.Techwing.models.HRQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HRQuestionRepository extends JpaRepository<HRQuestion, Long> {
    List<HRQuestion> findByIsActiveTrue();
    long countByIsActiveTrue();
}
