package com.example.Techwing.repository;

import com.example.Techwing.models.TechnologyTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TechnologyTrackRepository extends JpaRepository<TechnologyTrack, Long> {
    List<TechnologyTrack> findByIsActiveTrue();
    boolean existsByName(String name);
}
