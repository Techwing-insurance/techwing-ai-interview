package com.example.Techwing.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private String resumeStatus;
    private Long currentSessionId;
    private String currentSessionStatus;
    private Long completedSessions;
    private Double latestScore;
    private String latestRecommendation;
    private String trackName;
    private String candidateName;
}
