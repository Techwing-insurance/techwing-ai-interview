# TechWings AI Interview Assessment Platform
## Product Requirements Document (PRD) v1.0

> **Tagline:** An AI-powered voice-based interview platform for technical hiring, coding assessment, and HR evaluation.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas & Roles](#3-user-personas--roles)
4. [System Architecture](#4-system-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Data Flow & Workflow](#6-data-flow--workflow)
7. [Database Design — MySQL Tables](#7-database-design--mysql-tables)
8. [REST API Endpoints](#8-rest-api-endpoints)
9. [Backend Modules (Spring Boot)](#9-backend-modules-spring-boot)
10. [Python AI Service Design](#10-python-ai-service-design)
11. [Frontend Pages & Components](#11-frontend-pages--components)
12. [Technology Track Configuration](#12-technology-track-configuration)
13. [Interview Round Specifications](#13-interview-round-specifications)
14. [AI Evaluation Rubrics](#14-ai-evaluation-rubrics)
15. [Final Report Structure](#15-final-report-structure)
16. [AWS Infrastructure](#16-aws-infrastructure)
17. [Jenkins CI/CD Pipeline](#17-jenkins-cicd-pipeline)
18. [Non-Functional Requirements](#18-non-functional-requirements)
19. [Project Timeline — 16 Weeks](#19-project-timeline--16-weeks)
20. [Open Questions & Decisions](#20-open-questions--decisions)

---

## 1. Executive Summary

TechWings AI Interview Assessment Platform automates the first three hiring rounds for technology roles, enabling TechWings to screen hundreds of freshers simultaneously without recruiter involvement until the final decision stage.

The platform conducts:
- **Round 1** – Voice-based Technical Interview (AI ↔ Student)
- **Round 2** – DSA Coding Assessment (Monaco Editor + Code Execution Engine)
- **Round 3** – Voice-based HR Interview (AI ↔ Student)

After all three rounds, the AI generates a detailed PDF report with scores, strengths, weaknesses, and a personalized learning roadmap. The recruiter reviews the final report and makes the hire/no-hire decision.

> **Design Principle:** Every feature must answer — *"Would TechWings actually use this to interview students tomorrow?"*

---

## 2. Product Vision & Goals

### Vision
Replace the manual first-three-round interview process with a scalable, consistent, and data-driven AI platform that mirrors how top startups hire freshers.

### Goals

| Goal | Metric |
|------|--------|
| Allow 100+ concurrent interview sessions | Horizontal scaling on EC2 |
| Reduce time-to-report from 3 days to 30 minutes | Automated AI evaluation |
| Standardize interview quality across all students | Configurable question banks per track |
| Personalized feedback for every candidate | AI-generated learning roadmap |
| Zero manual effort until final review | Fully automated pipeline |

---

## 3. User Personas & Roles

### 3.1 Student
| Action | Description |
|--------|-------------|
| Register | Sign up with name, email, PIN, branch, and select technology track |
| Upload Resume | Upload PDF; system extracts skills, projects, experience |
| Attend Technical Round | Voice conversation with AI interviewer |
| Attend DSA Round | Solve 2–3 coding problems in Monaco Editor |
| Attend HR Round | Voice conversation with HR AI agent |
| View Report | Download full PDF assessment report |
| View Roadmap | Personalized learning path based on weak areas |

### 3.2 Trainer
| Action | Description |
|--------|-------------|
| Create Interview Tracks | Define tracks like Java Full Stack, AWS, DevOps |
| Upload Questions | Add questions to the question bank per track |
| Set Configurations | Define number of questions, time limits per round |
| View Student Reports | Review reports for students they manage |
| View Analytics | See aggregate performance across all students |

### 3.3 Admin
| Action | Description |
|--------|-------------|
| Manage Technologies | Add/update/delete technology tracks |
| Manage Interview Templates | Configure round structure per track |
| Manage Users | Activate/deactivate student and trainer accounts |
| View Platform Statistics | Sessions, completion rates, average scores |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    React + Tailwind CSS                         │
│    (Landing, Auth, Dashboard, Interview, Coding, Report)        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                    SPRING BOOT API GATEWAY                      │
│                  (Port 8080 / Tomcat on EC2)                    │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │  Auth Service │  │ Resume Service│  │ Interview Service │   │
│  │  JWT + Spring │  │ S3 + Metadata │  │ Session Mgmt      │   │
│  │  Security     │  │ Skill Extract │  │ Question Flow     │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ Coding Service│  │ Report Service│  │Analytics Service  │   │
│  │ Execution API │  │ PDF Generator │  │ Stats + Charts    │   │
│  │ Test Cases    │  │ Email Dispatch│  │ Leaderboard       │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (Internal)
┌────────────────────────────▼────────────────────────────────────┐
│                    PYTHON AI SERVICE                            │
│              FastAPI (Port 8000) — LangChain + LangGraph        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Resume Agent    │  │ Technical Agent  │  │  HR Agent    │  │
│  │  Skill Extract   │  │ Q Generator      │  │ Q Generator  │  │
│  │  Experience Parse│  │ Answer Evaluator │  │ Eval + Score │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Coding Feedback  │  │ Report Generator │                    │
│  │ Agent            │  │ + Roadmap Agent  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                 │
│              Whisper (STT) + TTS Engine                        │
│              OpenAI GPT-4o / Gemini Pro LLM                    │
└──────────┬─────────────────────────────────────────────────────┘
           │
     ┌─────▼──────────────────────────────────────────────┐
     │                  DATA LAYER                         │
     │   MySQL (AWS RDS)   │   AWS S3   │  CloudWatch      │
     └─────────────────────────────────────────────────────┘
```

### 4.1 Service Responsibility Map

| Service | Technology | Responsibility |
|---------|-----------|----------------|
| Auth Service | Spring Boot + JWT + Spring Security | Login, registration, token issuance, RBAC |
| Resume Service | Spring Boot + AWS S3 SDK | File upload, S3 storage, metadata persistence |
| Interview Service | Spring Boot | Session lifecycle, question sequencing, answer storage |
| Coding Service | Spring Boot + Docker | Code submission, sandboxed execution, test case evaluation |
| Report Service | Spring Boot + iText PDF | Report assembly, PDF generation, email delivery |
| Analytics Service | Spring Boot | Aggregate stats, leaderboard, trainer dashboards |
| Python AI Service | FastAPI + LangChain + LangGraph | All AI logic — resume parsing, interview Q&A, evaluation, roadmap |
| Notification Service | Spring Boot + JavaMailSender | Email notifications — report ready, interview scheduled |

---

## 5. Folder Structure

```
techwings-ai-platform/
│
├── frontend-react/                  # React + Tailwind CSS SPA
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Route-level pages
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # Axios API clients
│   │   ├── context/                 # Auth context, Interview state
│   │   ├── utils/                   # Helpers
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
│
├── backend-springboot/
│   ├── src/main/java/com/techwings/
│   │   ├── auth/                    # Auth module
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── model/
│   │   │   └── security/
│   │   ├── resume/                  # Resume module
│   │   ├── interview/               # Technical + HR interview module
│   │   ├── coding/                  # Coding round module
│   │   ├── report/                  # Report generation module
│   │   ├── analytics/               # Analytics module
│   │   ├── notification/            # Email notification module
│   │   └── shared/                  # DTOs, exceptions, config
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── application-prod.yml
│   ├── src/test/
│   └── pom.xml
│
├── python-ai/
│   ├── agents/
│   │   ├── resume_agent.py
│   │   ├── technical_agent.py
│   │   ├── hr_agent.py
│   │   ├── coding_feedback_agent.py
│   │   ├── report_agent.py
│   │   └── roadmap_agent.py
│   ├── services/
│   │   ├── stt_service.py           # Whisper / Web Speech API
│   │   ├── tts_service.py           # Text-to-Speech
│   │   └── llm_service.py           # LLM wrapper
│   ├── api/
│   │   ├── routers/
│   │   └── main.py                  # FastAPI entry point
│   ├── models/                      # Pydantic schemas
│   ├── prompts/                     # LangChain prompt templates
│   ├── config.py
│   └── requirements.txt
│
├── database/
│   ├── schema.sql                   # Full DDL
│   ├── seed_data.sql                # Technology tracks, sample questions
│   └── migrations/                  # Flyway migration scripts
│
├── jenkins/
│   └── Jenkinsfile
│
├── deployment/
│   ├── docker/
│   │   ├── Dockerfile.springboot
│   │   ├── Dockerfile.python
│   │   └── docker-compose.yml
│   └── aws/
│       ├── ec2-setup.sh
│       └── rds-setup.sql
│
├── documentation/
│   ├── PRD.md                       # This document
│   ├── API_Reference.md
│   └── Architecture_Diagrams/
│
└── test-data/
    ├── sample_resumes/
    └── coding_test_cases/
```

---

## 6. Data Flow & Workflow

### 6.1 End-to-End Student Journey

```
[1] REGISTRATION
Student → POST /api/auth/register
       → Validate input (email unique, PIN 6-digit)
       → Hash PIN (BCrypt)
       → Assign ROLE_STUDENT
       → Create user record (MySQL: users)
       → Return JWT Token

[2] LOGIN
Student → POST /api/auth/login
       → Validate credentials
       → Generate JWT (15 min access + 7 day refresh)
       → Return tokens

[3] RESUME UPLOAD
Student → POST /api/resume/upload (multipart/form-data)
       → Spring Boot validates file type (PDF only, max 5MB)
       → Upload to AWS S3 (bucket: techwings-resumes/{userId}/{timestamp}.pdf)
       → Store S3 URL in MySQL (resumes table)
       → Async: call Python AI → POST /ai/resume/analyze
           → AI extracts: skills, experience, projects, education
           → AI returns structured JSON
       → Store extracted data (MySQL: resume_analysis)
       → Update resume status = ANALYZED

[4] TECHNICAL INTERVIEW — Round 1
Student → POST /api/interview/technical/start
       → Create session record (interview_sessions: status=TECHNICAL_IN_PROGRESS)
       → Spring Boot calls Python AI → POST /ai/technical/initialize
           → AI loads: resume skills + technology track questions
           → AI selects 15 questions (adaptive based on resume)
           → Returns first question
       → Spring Boot stores question in (technical_answers: status=PENDING)
       → Return question text + audio (TTS) to frontend

Student answers (voice) →
       → Frontend records audio (MediaRecorder API)
       → POST /api/interview/technical/answer (audio file)
       → Spring Boot receives audio
       → Call Python AI → POST /ai/stt/transcribe
           → Whisper returns text transcript
       → Store transcript in technical_answers
       → Call Python AI → POST /ai/technical/evaluate
           → AI evaluates: accuracy, depth, communication
           → Returns: score (0-10), feedback, follow-up flag
       → Store evaluation
       → GET /api/interview/technical/next
           → If questions remain → return next question
           → If done → update session status = TECHNICAL_COMPLETE

[5] DSA CODING ROUND — Round 2
Student → POST /api/interview/coding/start
       → Update session status = CODING_IN_PROGRESS
       → Fetch 2–3 problems based on track + difficulty config
       → Return problems list with constraints (no hidden test cases shown)

Student codes → POST /api/interview/coding/run (code + language + problemId)
       → Spring Boot → Code Execution Service (Docker sandbox)
           → Compile code
           → Run against sample test cases
           → Return stdout/stderr + time/memory
       → Return results to student (for debugging)

Student submits → POST /api/interview/coding/submit
       → Spring Boot → Code Execution Service
           → Run against ALL hidden test cases
           → Calculate: passed count, time complexity hint
       → Store in coding_submissions
       → Call Python AI → POST /ai/coding/feedback
           → AI analyzes code quality, complexity, suggestions
           → Returns AI feedback string
       → Store AI feedback
       → When all problems attempted → status = CODING_COMPLETE

[6] HR INTERVIEW — Round 3
Student → POST /api/interview/hr/start
       → Update session status = HR_IN_PROGRESS
       → Python AI → POST /ai/hr/initialize
           → Load: resume summary, technology track, HR question bank
           → Select 8 questions
           → Return first question
       → TTS converts to audio

Same audio flow as Technical Round →
       → Transcribe → Evaluate:
           Confidence, Communication, Fluency, Grammar,
           Leadership, Positivity, Professionalism
       → Store in hr_answers
       → Cycle through all 8 questions
       → Update session status = HR_COMPLETE

[7] AI EVALUATION & REPORT GENERATION
After HR_COMPLETE →
       → Trigger async: POST /ai/report/generate
           → AI aggregates: all technical scores, coding results, HR scores
           → Calculates: overall score, recommendation
           → Generates: strengths list, weaknesses list
           → Builds: personalized learning roadmap
       → Spring Boot → Report Service
           → Assemble iText PDF report
           → Upload PDF to S3 (bucket: techwings-reports/)
           → Store PDF URL in interview_reports
           → Send email notification → student + trainer
       → Update session status = COMPLETED

[8] REPORT ACCESS
Student → GET /api/report/{sessionId}
       → Return report JSON (scores, feedback, roadmap)
       → GET /api/report/{sessionId}/download
           → Return pre-signed S3 URL (valid 1 hour)
```

### 6.2 Admin/Trainer Data Flow

```
Trainer → POST /api/admin/tracks          → Create technology track
Trainer → POST /api/admin/questions       → Add questions to track
Trainer → GET /api/admin/students         → View all student sessions
Trainer → GET /api/admin/analytics        → Aggregate performance data
Admin   → PUT /api/admin/config/{trackId} → Update interview configuration
```

---

## 7. Database Design — MySQL Tables

### 7.1 `users`
```sql
CREATE TABLE users (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    pin_hash     VARCHAR(255) NOT NULL,         -- BCrypt hashed
    branch       VARCHAR(100),
    phone        VARCHAR(15),
    college      VARCHAR(200),
    role         ENUM('STUDENT','TRAINER','ADMIN') NOT NULL DEFAULT 'STUDENT',
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 7.2 `technology_tracks`
```sql
CREATE TABLE technology_tracks (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,   -- e.g. "Java Full Stack"
    description  TEXT,
    icon_url     VARCHAR(500),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_by   BIGINT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 7.3 `interview_configurations`
```sql
CREATE TABLE interview_configurations (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    track_id                BIGINT NOT NULL,
    technical_question_count INT NOT NULL DEFAULT 15,
    technical_time_minutes   INT NOT NULL DEFAULT 25,
    coding_problem_count     INT NOT NULL DEFAULT 2,
    coding_time_minutes      INT NOT NULL DEFAULT 60,
    hr_question_count        INT NOT NULL DEFAULT 8,
    hr_time_minutes          INT NOT NULL DEFAULT 15,
    difficulty_distribution  JSON,               -- {"EASY": 3, "MEDIUM": 8, "HARD": 4}
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (track_id) REFERENCES technology_tracks(id)
);
```

### 7.4 `resumes`
```sql
CREATE TABLE resumes (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL UNIQUE,
    s3_url       VARCHAR(1000) NOT NULL,
    file_name    VARCHAR(255),
    file_size_kb INT,
    status       ENUM('UPLOADED','ANALYZING','ANALYZED','FAILED') DEFAULT 'UPLOADED',
    uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at  TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 7.5 `resume_analysis`
```sql
CREATE TABLE resume_analysis (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id       BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    skills          JSON,               -- ["Java", "Spring Boot", "MySQL", "React"]
    projects        JSON,               -- [{name, description, tech_stack}]
    experience_years DECIMAL(4,1),
    education       JSON,               -- [{degree, institution, year}]
    certifications  JSON,
    summary         TEXT,               -- AI-generated summary of candidate
    ai_raw_response TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 7.6 `interview_sessions`
```sql
CREATE TABLE interview_sessions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    track_id        BIGINT NOT NULL,
    config_id       BIGINT NOT NULL,
    status          ENUM(
                        'PENDING',
                        'TECHNICAL_IN_PROGRESS',
                        'TECHNICAL_COMPLETE',
                        'CODING_IN_PROGRESS',
                        'CODING_COMPLETE',
                        'HR_IN_PROGRESS',
                        'HR_COMPLETE',
                        'EVALUATING',
                        'COMPLETED',
                        'ABANDONED'
                    ) NOT NULL DEFAULT 'PENDING',
    technical_score  DECIMAL(5,2),
    coding_score     DECIMAL(5,2),
    hr_score         DECIMAL(5,2),
    overall_score    DECIMAL(5,2),
    recommendation   ENUM('STRONGLY_RECOMMENDED','RECOMMENDED','BORDERLINE','NOT_RECOMMENDED'),
    started_at       TIMESTAMP,
    technical_end_at TIMESTAMP,
    coding_end_at    TIMESTAMP,
    hr_end_at        TIMESTAMP,
    completed_at     TIMESTAMP,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (track_id) REFERENCES technology_tracks(id),
    FOREIGN KEY (config_id) REFERENCES interview_configurations(id)
);
```

### 7.7 `technical_questions`
```sql
CREATE TABLE technical_questions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    track_id         BIGINT NOT NULL,
    question_text    TEXT NOT NULL,
    expected_answer  TEXT,               -- Key points the AI uses to evaluate
    difficulty       ENUM('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
    category         VARCHAR(100),       -- e.g. "Core Java", "Spring Boot", "DB"
    tags             JSON,               -- ["hashmap", "collections", "java"]
    is_active        BOOLEAN DEFAULT TRUE,
    created_by       BIGINT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (track_id) REFERENCES technology_tracks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 7.8 `technical_answers`
```sql
CREATE TABLE technical_answers (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id       BIGINT NOT NULL,
    question_id      BIGINT NOT NULL,
    question_order   INT NOT NULL,       -- 1-based index within session
    audio_s3_url     VARCHAR(1000),
    transcript       TEXT,               -- Whisper output
    score            DECIMAL(4,2),       -- 0.00 to 10.00
    accuracy_score   DECIMAL(4,2),
    depth_score      DECIMAL(4,2),
    communication_score DECIMAL(4,2),
    ai_feedback      TEXT,
    answered_at      TIMESTAMP,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
    FOREIGN KEY (question_id) REFERENCES technical_questions(id)
);
```

### 7.9 `coding_problems`
```sql
CREATE TABLE coding_problems (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    track_id          BIGINT NOT NULL,
    title             VARCHAR(200) NOT NULL,
    description       LONGTEXT NOT NULL,
    difficulty        ENUM('EASY','MEDIUM','HARD') NOT NULL,
    constraints       TEXT,
    sample_input      TEXT,
    sample_output     TEXT,
    hidden_test_cases JSON,              -- [{input, expected_output}] — never sent to client
    time_limit_ms     INT DEFAULT 2000,
    memory_limit_mb   INT DEFAULT 256,
    tags              JSON,              -- ["array", "hashmap", "dp"]
    is_active         BOOLEAN DEFAULT TRUE,
    created_by        BIGINT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (track_id) REFERENCES technology_tracks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 7.10 `coding_submissions`
```sql
CREATE TABLE coding_submissions (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id         BIGINT NOT NULL,
    problem_id         BIGINT NOT NULL,
    language           ENUM('JAVA','PYTHON','JAVASCRIPT','CPP') NOT NULL DEFAULT 'JAVA',
    code               LONGTEXT NOT NULL,
    submission_type    ENUM('RUN','SUBMIT') NOT NULL,
    status             ENUM('PENDING','RUNNING','ACCEPTED','WRONG_ANSWER',
                            'TIME_LIMIT_EXCEEDED','MEMORY_LIMIT_EXCEEDED',
                            'COMPILATION_ERROR','RUNTIME_ERROR') DEFAULT 'PENDING',
    total_test_cases   INT,
    passed_test_cases  INT,
    execution_time_ms  INT,
    memory_used_mb     INT,
    stderr             TEXT,
    ai_feedback        TEXT,             -- AI complexity analysis + suggestions
    submitted_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
    FOREIGN KEY (problem_id) REFERENCES coding_problems(id)
);
```

### 7.11 `hr_questions`
```sql
CREATE TABLE hr_questions (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    category      ENUM('INTRODUCTION','MOTIVATION','BEHAVIORAL',
                       'SITUATIONAL','CULTURAL_FIT') NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    created_by    BIGINT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 7.12 `hr_answers`
```sql
CREATE TABLE hr_answers (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id           BIGINT NOT NULL,
    question_id          BIGINT NOT NULL,
    question_order       INT NOT NULL,
    audio_s3_url         VARCHAR(1000),
    transcript           TEXT,
    confidence_score     DECIMAL(4,2),   -- 0–10
    communication_score  DECIMAL(4,2),
    fluency_score        DECIMAL(4,2),
    grammar_score        DECIMAL(4,2),
    leadership_score     DECIMAL(4,2),
    positivity_score     DECIMAL(4,2),
    professionalism_score DECIMAL(4,2),
    overall_hr_score     DECIMAL(4,2),
    ai_feedback          TEXT,
    answered_at          TIMESTAMP,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
    FOREIGN KEY (question_id) REFERENCES hr_questions(id)
);
```

### 7.13 `interview_reports`
```sql
CREATE TABLE interview_reports (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id          BIGINT NOT NULL UNIQUE,
    user_id             BIGINT NOT NULL,
    technical_score     DECIMAL(5,2),
    coding_score        DECIMAL(5,2),
    hr_score            DECIMAL(5,2),
    overall_score       DECIMAL(5,2),
    recommendation      ENUM('STRONGLY_RECOMMENDED','RECOMMENDED','BORDERLINE','NOT_RECOMMENDED'),
    strengths           JSON,            -- ["Strong Java concepts", "Good communication"]
    weaknesses          JSON,            -- ["Binary Trees", "Dynamic Programming"]
    technical_breakdown JSON,            -- {"Java": 9, "Spring Boot": 8, "DB": 7}
    hr_breakdown        JSON,            -- {"Communication": 9, "Confidence": 8}
    coding_breakdown    JSON,            -- [{problem_id, passed, score}]
    ai_summary          TEXT,            -- AI-generated narrative summary
    pdf_s3_url          VARCHAR(1000),
    email_sent          BOOLEAN DEFAULT FALSE,
    generated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 7.14 `learning_roadmaps`
```sql
CREATE TABLE learning_roadmaps (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id   BIGINT NOT NULL UNIQUE,
    user_id      BIGINT NOT NULL,
    roadmap_json JSON NOT NULL,      -- Structured week-by-week plan
    /*
     Example roadmap_json:
     {
       "weeks": [
         {
           "week": 1,
           "focus": "Dynamic Programming",
           "topics": ["Memoization", "Tabulation", "LCS"],
           "resources": [{"type":"video","title":"...","url":"..."}]
         }
       ],
       "priority_topics": ["Redis", "Docker", "Graphs"],
       "estimated_duration_weeks": 8
     }
    */
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 7.15 `voice_recordings`
```sql
CREATE TABLE voice_recordings (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id   BIGINT NOT NULL,
    round_type   ENUM('TECHNICAL','HR') NOT NULL,
    question_ref BIGINT NOT NULL,      -- FK to technical_answers.id or hr_answers.id
    s3_url       VARCHAR(1000) NOT NULL,
    duration_sec INT,
    file_size_kb INT,
    recorded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);
```

### 7.16 `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 8. REST API Endpoints

> Base URL: `https://api.techwings.io/api/v1`
> All protected routes require: `Authorization: Bearer <JWT>`

### 8.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new student |
| POST | `/auth/login` | Public | Login with email + PIN |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | User | Revoke refresh token |
| GET | `/auth/me` | User | Get current user profile |
| PUT | `/auth/profile` | User | Update profile details |

**POST /auth/register — Request:**
```json
{
  "name": "Rahul Kumar",
  "email": "rahul@college.edu",
  "pin": "123456",
  "branch": "Computer Science",
  "phone": "9876543210",
  "college": "ABC Engineering College",
  "trackId": 1
}
```

**POST /auth/register — Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "userId": 42,
    "name": "Rahul Kumar",
    "email": "rahul@college.edu",
    "role": "STUDENT",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### 8.2 Resume

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/resume/upload` | Student | Upload PDF resume |
| GET | `/resume/status` | Student | Check analysis status |
| GET | `/resume/analysis` | Student | Get extracted data |
| GET | `/resume/preview` | Student | Get pre-signed S3 URL for PDF view |

**POST /resume/upload — Request:**
```
Content-Type: multipart/form-data
Body: file=<PDF file>
```

**GET /resume/analysis — Response:**
```json
{
  "success": true,
  "data": {
    "status": "ANALYZED",
    "skills": ["Java", "Spring Boot", "MySQL", "React", "Git"],
    "experience": 0.5,
    "projects": [
      {
        "name": "E-Commerce App",
        "description": "Built using Spring Boot and React",
        "techStack": ["Spring Boot", "React", "MySQL"]
      }
    ],
    "education": [
      {
        "degree": "B.Tech CSE",
        "institution": "ABC Engineering College",
        "year": 2025
      }
    ],
    "summary": "Final-year CSE student with strong Java background..."
  }
}
```

---

### 8.3 Technical Interview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/interview/technical/start` | Student | Start technical round |
| GET | `/interview/technical/current` | Student | Get current question |
| POST | `/interview/technical/answer` | Student | Submit audio answer |
| GET | `/interview/technical/next` | Student | Move to next question |
| POST | `/interview/technical/complete` | Student | Mark round as done |
| GET | `/interview/technical/summary` | Student | Round score summary |

**POST /interview/technical/start — Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": 101,
    "totalQuestions": 15,
    "timeLimitMinutes": 25,
    "currentQuestion": {
      "order": 1,
      "text": "Tell me about yourself and your technical background.",
      "audioUrl": "https://tts.techwings.io/q1_audio.mp3",
      "category": "INTRODUCTION"
    }
  }
}
```

**POST /interview/technical/answer — Request:**
```
Content-Type: multipart/form-data
Body:
  sessionId: 101
  questionOrder: 1
  audioFile: <WebM audio blob>
```

**POST /interview/technical/answer — Response:**
```json
{
  "success": true,
  "data": {
    "transcribed": "I am Rahul, a final-year student with experience in Java and Spring Boot...",
    "evaluated": true,
    "score": 8.5,
    "feedback": "Good introduction. Could elaborate more on specific projects.",
    "nextAvailable": true
  }
}
```

---

### 8.4 Coding Round

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/interview/coding/start` | Student | Start coding round |
| GET | `/interview/coding/problems` | Student | Get problems list |
| GET | `/interview/coding/problem/{id}` | Student | Get single problem |
| POST | `/interview/coding/run` | Student | Run code against sample cases |
| POST | `/interview/coding/submit` | Student | Submit final solution |
| GET | `/interview/coding/result/{submissionId}` | Student | Get submission result |
| POST | `/interview/coding/complete` | Student | Mark coding round done |

**POST /interview/coding/run — Request:**
```json
{
  "sessionId": 101,
  "problemId": 5,
  "language": "JAVA",
  "code": "class Solution { public int[] twoSum(int[] nums, int target) { ... } }"
}
```

**POST /interview/coding/run — Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": 201,
    "status": "ACCEPTED",
    "passedCases": 2,
    "totalCases": 2,
    "executionTimeMs": 45,
    "memoryMb": 12,
    "stdout": "Test 1: PASS\nTest 2: PASS",
    "stderr": null
  }
}
```

**POST /interview/coding/submit — Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": 202,
    "status": "ACCEPTED",
    "passedCases": 8,
    "totalCases": 10,
    "executionTimeMs": 120,
    "memoryMb": 18,
    "aiFeedback": "Your solution is correct! However, your current O(n²) approach can be improved. Using a HashMap would bring the time complexity down to O(n) with O(n) space.",
    "score": 80
  }
}
```

---

### 8.5 HR Interview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/interview/hr/start` | Student | Start HR round |
| GET | `/interview/hr/current` | Student | Get current HR question |
| POST | `/interview/hr/answer` | Student | Submit audio answer |
| GET | `/interview/hr/next` | Student | Next HR question |
| POST | `/interview/hr/complete` | Student | Mark HR round done |

*(Request/Response pattern mirrors Technical Interview)*

---

### 8.6 Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/report/{sessionId}` | Student/Trainer | Get full report JSON |
| GET | `/report/{sessionId}/download` | Student/Trainer | Pre-signed S3 URL for PDF |
| GET | `/report/{sessionId}/roadmap` | Student | Personalized learning roadmap |
| GET | `/report/my-reports` | Student | List all reports for student |

**GET /report/{sessionId} — Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": 101,
    "candidate": {
      "name": "Rahul Kumar",
      "email": "rahul@college.edu",
      "track": "Java Full Stack"
    },
    "technicalScore": 82.5,
    "codingScore": 78.0,
    "hrScore": 86.0,
    "overallScore": 82.0,
    "recommendation": "RECOMMENDED",
    "technicalBreakdown": {
      "Java": 9,
      "Spring Boot": 8,
      "Database": 7,
      "REST APIs": 9,
      "AWS": 6
    },
    "codingBreakdown": [
      { "problem": "Two Sum", "difficulty": "EASY", "passed": true, "score": 100 },
      { "problem": "LRU Cache", "difficulty": "MEDIUM", "passed": true, "score": 85 },
      { "problem": "Binary Tree Paths", "difficulty": "HARD", "passed": false, "score": 40 }
    ],
    "hrBreakdown": {
      "Communication": 9,
      "Confidence": 8,
      "Leadership": 7,
      "Grammar": 9,
      "Professionalism": 8
    },
    "strengths": ["Strong Java fundamentals", "Good REST API knowledge", "Excellent communication"],
    "weaknesses": ["AWS knowledge needs improvement", "Binary Trees", "Dynamic Programming"],
    "aiSummary": "Rahul demonstrates strong core Java skills and effective communication. Recommended for the Java Full Stack role. Suggest focused preparation on AWS services and advanced DSA topics.",
    "generatedAt": "2025-07-14T16:30:00"
  }
}
```

---

### 8.7 Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/student` | Student | Student dashboard data |
| GET | `/dashboard/trainer` | Trainer | Trainer dashboard data |
| GET | `/dashboard/admin` | Admin | Admin dashboard data |

**GET /dashboard/student — Response:**
```json
{
  "data": {
    "resumeStatus": "ANALYZED",
    "currentSession": { "id": 101, "status": "CODING_IN_PROGRESS" },
    "completedSessions": 2,
    "latestScore": 82.0,
    "latestRecommendation": "RECOMMENDED",
    "performanceTrend": [{ "date": "2025-07-01", "score": 74 }, { "date": "2025-07-14", "score": 82 }]
  }
}
```

---

### 8.8 Admin / Trainer Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/tracks` | Trainer/Admin | List all tracks |
| POST | `/admin/tracks` | Admin | Create new track |
| PUT | `/admin/tracks/{id}` | Admin | Update track |
| DELETE | `/admin/tracks/{id}` | Admin | Deactivate track |
| GET | `/admin/questions/{trackId}` | Trainer | Get questions for track |
| POST | `/admin/questions` | Trainer | Add question |
| PUT | `/admin/questions/{id}` | Trainer | Edit question |
| DELETE | `/admin/questions/{id}` | Trainer | Remove question |
| POST | `/admin/coding-problems` | Trainer | Add coding problem |
| GET | `/admin/students` | Trainer/Admin | List all students |
| GET | `/admin/students/{id}/sessions` | Trainer | Student session list |
| GET | `/admin/analytics` | Admin | Platform analytics |
| PUT | `/admin/users/{id}/activate` | Admin | Activate/deactivate user |
| PUT | `/admin/config/{trackId}` | Admin | Update interview configuration |

---

### 8.9 Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/overview` | Admin | Total students, sessions, avg scores |
| GET | `/analytics/track/{trackId}` | Trainer | Performance by track |
| GET | `/analytics/leaderboard` | Trainer | Top performers |
| GET | `/analytics/completion-rate` | Admin | Interview completion funnel |

---

## 9. Backend Modules (Spring Boot)

### 9.1 Auth Module

```
auth/
├── controller/AuthController.java
├── service/AuthService.java
├── service/JwtService.java
├── repository/UserRepository.java
├── repository/RefreshTokenRepository.java
├── model/User.java
├── model/RefreshToken.java
├── dto/RegisterRequest.java
├── dto/LoginRequest.java
├── dto/AuthResponse.java
└── security/
    ├── JwtAuthFilter.java
    ├── SecurityConfig.java
    └── UserDetailsServiceImpl.java
```

**Key Decisions:**
- PIN stored as BCrypt hash (strength 12)
- JWT Access Token: 15 minutes
- JWT Refresh Token: 7 days (stored in DB, revocable)
- Role-based method security: `@PreAuthorize("hasRole('ADMIN')")`

---

### 9.2 Resume Module

```
resume/
├── controller/ResumeController.java
├── service/ResumeService.java
├── service/S3Service.java
├── service/AIResumeClient.java          # RestTemplate to Python AI
├── repository/ResumeRepository.java
├── repository/ResumeAnalysisRepository.java
├── model/Resume.java
├── model/ResumeAnalysis.java
└── dto/ResumeAnalysisResponse.java
```

**S3 Storage Pattern:**
```
s3://techwings-resumes/
  └── {userId}/
        └── {timestamp}_{filename}.pdf
```

---

### 9.3 Interview Module

```
interview/
├── controller/
│   ├── TechnicalInterviewController.java
│   ├── CodingController.java
│   └── HRInterviewController.java
├── service/
│   ├── TechnicalInterviewService.java
│   ├── CodingService.java
│   ├── HRInterviewService.java
│   └── CodeExecutionClient.java          # HTTP to Docker executor
├── repository/
│   ├── InterviewSessionRepository.java
│   ├── TechnicalAnswerRepository.java
│   ├── CodingSubmissionRepository.java
│   └── HRAnswerRepository.java
├── model/ (all JPA entities)
└── ai/
    ├── AITechnicalClient.java
    └── AIHRClient.java
```

---

### 9.4 Code Execution Service

The coding module uses a **sandboxed Docker container** approach:

```
Spring Boot → POST /execute (internal)
           → Docker container (per submission)
               → Compile code (javac / python3 / g++)
               → Run with test case stdin (timeout: 2s)
               → Capture stdout/stderr
               → Kill container
           → Return result
```

**Security Boundaries:**
- No network access inside container
- No file system write permissions
- CPU and memory limits enforced
- Execution timeout hard-killed at 3 seconds

---

### 9.5 Report Module

```
report/
├── controller/ReportController.java
├── service/ReportService.java
├── service/PDFGeneratorService.java      # iText 7
├── service/EmailService.java             # JavaMailSender
├── service/AIReportClient.java
├── repository/ReportRepository.java
├── repository/RoadmapRepository.java
└── model/InterviewReport.java
```

**PDF Report Sections:**
1. TechWings header with logo
2. Candidate profile
3. Technical round scorecard with per-topic breakdown
4. Coding round results with problem-level detail
5. HR round scorecard
6. Overall recommendation badge
7. Strengths and weaknesses
8. Personalized learning roadmap (week-by-week)
9. AI narrative summary

---

## 10. Python AI Service Design

### 10.1 FastAPI Application Structure

```
python-ai/
├── api/
│   ├── main.py
│   └── routers/
│       ├── resume_router.py
│       ├── technical_router.py
│       ├── coding_router.py
│       ├── hr_router.py
│       ├── stt_router.py
│       └── report_router.py
├── agents/
│   ├── resume_agent.py
│   ├── technical_agent.py
│   ├── hr_agent.py
│   ├── coding_feedback_agent.py
│   ├── report_agent.py
│   └── roadmap_agent.py
├── prompts/
│   ├── resume_analysis_prompt.txt
│   ├── technical_question_prompt.txt
│   ├── technical_eval_prompt.txt
│   ├── hr_question_prompt.txt
│   ├── hr_eval_prompt.txt
│   ├── coding_feedback_prompt.txt
│   └── report_generation_prompt.txt
├── services/
│   ├── stt_service.py               # OpenAI Whisper API
│   ├── tts_service.py               # OpenAI TTS / gTTS
│   └── llm_service.py               # LangChain wrapper
└── models/
    ├── resume_models.py
    ├── interview_models.py
    └── report_models.py
```

### 10.2 Agent Responsibilities

#### Resume Agent (`POST /ai/resume/analyze`)
- Input: PDF URL (from S3), candidate name
- Process: Download PDF → extract text → LLM parse → structured output
- Output: `skills[]`, `projects[]`, `experience_years`, `education[]`, `summary`

#### Technical Agent (`POST /ai/technical/initialize`)
- Input: `trackId`, `resumeSkills[]`, `configuredQuestionCount`
- Process: Load question bank → adaptive selection based on resume skills → return ordered list
- Output: `questions[]` (ordered, with expected answer key points)

#### Technical Agent (`POST /ai/technical/evaluate`)
- Input: `questionText`, `expectedAnswer`, `transcribedAnswer`
- Process: LLM scoring on rubric (accuracy, depth, communication)
- Output: `score`, `accuracy_score`, `depth_score`, `communication_score`, `feedback`

#### HR Agent (`POST /ai/hr/initialize`)
- Input: `resumeSummary`, `trackName`, `questionCount`
- Process: Select appropriate HR questions from bank + resume context
- Output: `questions[]`

#### HR Agent (`POST /ai/hr/evaluate`)
- Input: `questionText`, `transcribedAnswer`
- Process: LLM multi-dimensional scoring
- Output: `confidence`, `communication`, `fluency`, `grammar`, `leadership`, `positivity`, `professionalism`, `feedback`

#### Coding Feedback Agent (`POST /ai/coding/feedback`)
- Input: `code`, `language`, `passedCases`, `totalCases`, `problemDescription`
- Process: Analyze code quality, complexity, edge cases
- Output: `aiFeedback`, `complexity`, `suggestions[]`

#### Report Agent (`POST /ai/report/generate`)
- Input: All technical answers, coding submissions, HR answers, resume analysis
- Process: Aggregate all scores → compute weighted overall → generate narrative
- Output: `overall_score`, `recommendation`, `strengths[]`, `weaknesses[]`, `ai_summary`

#### Roadmap Agent (`POST /ai/report/roadmap`)
- Input: `weaknesses[]`, `track`, `overall_score`
- Process: Match weaknesses to learning resources → build week-by-week plan
- Output: `roadmap_json`

### 10.3 STT Flow

```
Frontend (MediaRecorder) → WebM audio blob
        ↓
POST /interview/technical/answer (Spring Boot)
        ↓
Spring Boot sends audio file to:
POST /ai/stt/transcribe
        ↓
Python calls: openai.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
    language="en"
)
        ↓
Returns: { "transcript": "...", "confidence": 0.95 }
```

### 10.4 TTS Flow

```
AI generates question text
        ↓
POST /ai/tts/generate (Python)
        ↓
Python calls: openai.audio.speech.create(
    model="tts-1",
    voice="nova",
    input=question_text
)
        ↓
Returns MP3 audio bytes
        ↓
Spring Boot stores in S3 or streams directly to frontend
```

### 10.5 Score Weighting Formula

```
Technical Score  = Average of all technical_answer.score       (weighted by difficulty)
Coding Score     = (passed_test_cases / total_test_cases) * 100
HR Score         = Average of all 7 HR dimensions

Overall Score    = (Technical * 0.40) + (Coding * 0.35) + (HR * 0.25)

Recommendation:
  Overall >= 85  → STRONGLY_RECOMMENDED
  Overall >= 70  → RECOMMENDED
  Overall >= 55  → BORDERLINE
  Overall < 55   → NOT_RECOMMENDED
```

---

## 11. Frontend Pages & Components

### 11.1 Page Routing

```
/                         → Landing Page
/login                    → Login Page
/register                 → Registration Page
/dashboard                → Student Dashboard
/resume                   → Resume Upload + Analysis
/interview/technical      → Technical Interview Screen
/interview/coding         → Coding Round Screen
/interview/hr             → HR Interview Screen
/report/:sessionId        → Final Report
/roadmap/:sessionId       → Learning Roadmap
/admin                    → Admin Dashboard
/admin/tracks             → Track Management
/admin/questions          → Question Bank
/admin/students           → Student Management
/admin/analytics          → Analytics Dashboard
```

### 11.2 Key Components

| Component | Description |
|-----------|-------------|
| `VoiceInterface` | Mic button, waveform animation, recording indicator |
| `QuestionCard` | Current question display with audio playback |
| `Timer` | Countdown timer for each round |
| `MonacoEditor` | Code editor with language selector |
| `TestCasePanel` | Input/output panels for coding round |
| `ScoreCard` | Visual score display with progress rings |
| `ReportCard` | Full report with charts and breakdown |
| `RoadmapTimeline` | Week-by-week learning timeline |
| `PerformanceChart` | Radar chart for multi-dimension scores |

### 11.3 State Management Strategy

```
Context:
  AuthContext       → user, token, role, logout
  InterviewContext  → sessionId, currentRound, questionIndex, timeLeft

Local State (per page):
  Technical Page    → isRecording, currentQuestion, transcript, isEvaluating
  Coding Page       → code, language, output, isRunning, isSubmitting
  HR Page           → isRecording, currentQuestion, transcript
```

---

## 12. Technology Track Configuration

### 12.1 Available Tracks (Seed Data)

| Track | Technical Focus | Sample Topics |
|-------|----------------|---------------|
| Java Full Stack | Core Java, Spring Boot, MySQL, REST, React | JVM, Collections, JPA, JWT, JDBC |
| AWS | EC2, S3, RDS, Lambda, IAM, VPC | Auto Scaling, Load Balancer, CloudWatch |
| DevOps | Jenkins, Docker, Kubernetes, CI/CD | Dockerfile, Helm, Ansible, Terraform |
| GenAI | LLMs, Prompt Engineering, RAG, LangChain | Embeddings, Vector DB, Fine-tuning |
| Python | Python core, OOP, pandas, Flask/Django | GIL, decorators, async, ORM |
| Frontend | HTML/CSS/JS, React, TypeScript | DOM, hooks, state, bundlers |
| Data Science | ML, pandas, sklearn, statistics | Regression, classification, EDA |
| Cyber Security | OWASP, Networking, Cryptography | SQL injection, XSS, TLS, JWT attacks |

### 12.2 Configuration Example (Java Full Stack)

```json
{
  "trackId": 1,
  "trackName": "Java Full Stack",
  "technical": {
    "questionCount": 15,
    "timeLimitMinutes": 25,
    "difficultyDistribution": { "EASY": 4, "MEDIUM": 8, "HARD": 3 },
    "categories": ["Core Java", "Spring Boot", "Database", "REST APIs", "Frontend Basics"]
  },
  "coding": {
    "problemCount": 2,
    "timeLimitMinutes": 60,
    "difficulties": ["EASY", "MEDIUM"]
  },
  "hr": {
    "questionCount": 8,
    "timeLimitMinutes": 15
  }
}
```

---

## 13. Interview Round Specifications

### 13.1 Round 1 — Technical Interview

**Duration:** 25 minutes  
**Questions:** 15 (adaptive based on resume)  
**Format:** Voice-to-Voice AI conversation  

**Question Flow:**
1. Introduction question (always first)
2. Core technology questions (based on track)
3. Resume-specific questions (based on extracted skills/projects)
4. Difficulty escalation based on previous answers

**AI Evaluation Rubric (per answer):**

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Technical Accuracy | 50% | Correctness of concepts, terms, examples |
| Depth of Knowledge | 30% | Ability to explain WHY, not just WHAT |
| Communication Clarity | 20% | Clear, structured explanation |

---

### 13.2 Round 2 — DSA Coding Assessment

**Duration:** 60 minutes  
**Problems:** 2–3 (1 Easy, 1 Medium, 1 Medium/Hard)  
**Format:** Monaco Editor + Compile/Run/Submit  

**Problem Display:**
- Problem statement with constraints
- Sample inputs/outputs
- Language selector (Java default)
- Run button (sample cases only)
- Submit button (all hidden cases)
- Timer

**AI Feedback triggers after each Submit:**
- Time complexity analysis
- Space complexity analysis
- Code quality observations
- Optimization suggestions

---

### 13.3 Round 3 — HR Interview

**Duration:** 15 minutes  
**Questions:** 8  
**Format:** Voice-to-Voice AI conversation  

**Standard HR Questions:**
1. Tell me about yourself
2. Why should we hire you?
3. Tell me about a challenge you faced
4. Describe your final-year project
5. Where do you see yourself in five years?
6. Why TechWings?
7. Are you willing to relocate?
8. Do you have any questions for us?

**AI Evaluation Dimensions:**

| Dimension | Description |
|-----------|-------------|
| Confidence | Assertiveness, speaking pace, conviction |
| Communication | Clarity, vocabulary, sentence structure |
| Fluency | Smooth speech, minimal filler words |
| Grammar | Grammatical correctness in English |
| Leadership | Examples of initiative or leading teams |
| Positivity | Optimistic framing, enthusiasm |
| Professionalism | Formal tone, appropriate content |

---

## 14. AI Evaluation Rubrics

### 14.1 Technical Answer Scoring Guide

```
Score 9–10: Correct answer with deep explanation, real-world examples
Score 7–8:  Mostly correct with good understanding
Score 5–6:  Partially correct, missing key concepts
Score 3–4:  Vague answer, significant gaps
Score 1–2:  Incorrect or completely off-topic
Score 0:    No answer / "I don't know"
```

### 14.2 Coding Score Calculation

```
Raw Score = (passed_cases / total_cases) * 100

Bonus Points (AI discretion ±5%):
  + Optimal time complexity
  + Clean code structure
  + Edge case handling

Final Coding Score = min(100, Raw Score + Bonus)
```

### 14.3 HR Score Calculation

```
Each of 7 dimensions scored 0–10
HR_Score = (sum of all dimensions) / 7
```

---

## 15. Final Report Structure

### 15.1 PDF Report Sections

```
PAGE 1: Cover
  ├── TechWings Logo
  ├── "Interview Assessment Report"
  ├── Candidate Name
  ├── Technology Track
  ├── Date of Interview
  └── Recommendation Badge (RECOMMENDED / NOT RECOMMENDED)

PAGE 2: Scores Overview
  ├── Overall Score: 82/100
  ├── Technical Round: 82.5/100
  ├── Coding Round: 78.0/100
  └── HR Round: 86.0/100

PAGE 3: Technical Breakdown
  ├── Per-topic scores (bar chart)
  ├── Top 3 strongest topics
  └── Bottom 3 weakest topics

PAGE 4: Coding Breakdown
  ├── Problem 1: Two Sum       ✔ (100/100)
  ├── Problem 2: LRU Cache     ✔ (85/100)
  ├── Problem 3: Binary Trees  ✘ (40/100)
  └── AI Feedback per problem

PAGE 5: HR Breakdown
  ├── Radar chart (7 dimensions)
  └── AI narrative of communication style

PAGE 6: AI Summary & Recommendation
  ├── Strengths list
  ├── Weaknesses list
  └── AI narrative paragraph

PAGE 7: Personalized Learning Roadmap
  ├── Priority topics
  ├── Week-by-week plan
  └── Curated resources
```

---

## 16. AWS Infrastructure

```
                        INTERNET
                           │
                    Route 53 (DNS)
                           │
                     CloudFront CDN
                    (React static files)
                           │
                   Application Load Balancer
                           │
                  ┌────────┴────────┐
                  │                 │
               EC2 #1           EC2 #2
            (Spring Boot)    (Spring Boot)
               Tomcat           Tomcat
                  │                 │
                  └────────┬────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
        EC2 (Python AI)           RDS MySQL (db.t3.medium)
         FastAPI + Gunicorn        Multi-AZ enabled
                                   Automated backups
            │
        AWS S3 Buckets
        ├── techwings-resumes
        ├── techwings-reports
        └── techwings-audio

        CloudWatch
        ├── EC2 metrics
        ├── RDS metrics
        ├── Application logs
        └── Alarms → SNS → Email
```

### 16.1 EC2 Sizing

| Instance | Type | Use Case |
|----------|------|----------|
| Spring Boot (×2) | t3.medium (2vCPU, 4GB) | API load balanced |
| Python AI | t3.large (2vCPU, 8GB) | AI inference |
| Code Executor | t3.small (burstable) | Docker code runs |
| RDS MySQL | db.t3.medium | Production DB |

### 16.2 S3 Bucket Structure

```
techwings-resumes/
  └── {userId}/{timestamp}_{filename}.pdf

techwings-audio/
  └── {sessionId}/{round}_{questionOrder}_{timestamp}.webm

techwings-reports/
  └── {sessionId}/report_{timestamp}.pdf

techwings-tts/
  └── {trackId}/{questionId}/audio.mp3  (cached TTS output)
```

---

## 17. Jenkins CI/CD Pipeline

### 17.1 Jenkinsfile Overview

```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps { git branch: 'main', url: 'https://github.com/techwings/ai-platform.git' }
        }

        stage('Backend Build') {
            steps {
                dir('backend-springboot') {
                    sh 'mvn clean compile'
                }
            }
        }

        stage('Backend Test') {
            steps {
                dir('backend-springboot') {
                    sh 'mvn test'
                    junit 'target/surefire-reports/**/*.xml'
                }
            }
        }

        stage('Backend Package') {
            steps {
                dir('backend-springboot') {
                    sh 'mvn package -DskipTests'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend-react') {
                    sh 'npm ci && npm run build'
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                sh 'scp backend-springboot/target/techwings.war ec2-user@${EC2_IP}:/opt/tomcat/webapps/'
                sh 'ssh ec2-user@${EC2_IP} "sudo systemctl restart tomcat"'
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh 'aws s3 sync frontend-react/dist s3://techwings-frontend --delete'
                sh 'aws cloudfront create-invalidation --distribution-id ${CF_ID} --paths "/*"'
            }
        }

        stage('Deploy Python AI') {
            steps {
                sh 'scp -r python-ai/ ec2-user@${AI_EC2_IP}:/opt/python-ai/'
                sh 'ssh ec2-user@${AI_EC2_IP} "cd /opt/python-ai && pip install -r requirements.txt && sudo systemctl restart python-ai"'
            }
        }

        stage('Health Check') {
            steps {
                sh 'sleep 30 && curl -f https://api.techwings.io/actuator/health || exit 1'
            }
        }
    }

    post {
        success { mail to: 'devteam@techwings.io', subject: '✅ Deploy SUCCESS', body: "Build ${env.BUILD_NUMBER} deployed successfully." }
        failure { mail to: 'devteam@techwings.io', subject: '❌ Deploy FAILED', body: "Build ${env.BUILD_NUMBER} failed. Check Jenkins logs." }
    }
}
```

---

## 18. Non-Functional Requirements

### 18.1 Performance

| Metric | Target |
|--------|--------|
| API Response Time (non-AI) | < 300ms |
| AI Response (STT/Eval) | < 5 seconds |
| PDF Report Generation | < 30 seconds |
| Concurrent Interview Sessions | 100+ |
| Resume Upload | < 10 seconds end-to-end |

### 18.2 Security

| Area | Implementation |
|------|----------------|
| Authentication | JWT (HS256, 15-min access, 7-day refresh) |
| Password/PIN | BCrypt strength 12 |
| API Authorization | Spring Security method-level RBAC |
| File Upload | PDF-only, 5MB max, virus scan hook |
| Code Execution | Docker sandbox (no network, no disk write) |
| Hidden Test Cases | Never sent to client; backend-only |
| S3 Access | Pre-signed URLs (1-hour expiry), no public access |
| HTTPS | Enforced at ALB; HTTP redirected to HTTPS |

### 18.3 Reliability

- RDS Multi-AZ for database failover
- EC2 Auto Scaling Group (min 2, max 5 instances)
- S3 versioning enabled for resumes and reports
- Daily automated RDS snapshots (30-day retention)
- CloudWatch alarms for CPU > 80%, error rate > 5%

### 18.4 Scalability

- Stateless Spring Boot (all session state in DB)
- Async AI evaluation using Spring `@Async` + thread pools
- Python AI service horizontally scalable behind internal LB
- S3 for all binary file storage (no EC2 disk dependency)

---

## 19. Project Timeline — 16 Weeks

| Phase | Weeks | Deliverables |
|-------|-------|-------------|
| **Phase 1: Planning** | 1–2 | Finalize requirements, Figma UI, DB schema, API contracts |
| **Phase 2: Backend** | 3–5 | Spring Boot skeleton, Auth (JWT), MySQL setup, Resume upload API, core REST endpoints |
| **Phase 3: Frontend** | 6–8 | React app, Login/Register, Dashboard, Resume upload page, Coding editor |
| **Phase 4: AI Integration** | 9–11 | Python AI service, STT/TTS, Technical interview, HR interview, Resume analysis |
| **Phase 5: Coding Round** | 12–13 | Monaco Editor integration, Code execution Docker, Test case evaluation, AI feedback |
| **Phase 6: DevOps** | 14–15 | AWS EC2, RDS, S3, Jenkins pipeline, Tomcat deployment, CI/CD |
| **Phase 7: Testing & Docs** | 16 | E2E testing, performance testing, project report, final deployment, demo |

### Week-by-Week Breakdown

**Weeks 1–2 (Planning):**
- [ ] Finalize all 20 DB tables with DDL
- [ ] Finalize all API endpoint contracts
- [ ] Create Figma wireframes for all 15 pages
- [ ] Set up GitHub repository with branch strategy
- [ ] Set up local MySQL + Spring Boot skeleton

**Weeks 3–5 (Backend Core):**
- [ ] User registration + login (JWT)
- [ ] Resume upload to S3
- [ ] Interview session CRUD
- [ ] Technical/Coding/HR question management APIs
- [ ] Report generation skeleton
- [ ] Swagger/OpenAPI documentation

**Weeks 6–8 (Frontend Core):**
- [ ] Project setup (React + Tailwind + Axios)
- [ ] Auth pages (Login, Register)
- [ ] Student Dashboard
- [ ] Resume upload with drag-and-drop
- [ ] Interview screens (placeholder, no voice yet)
- [ ] Monaco Editor integration
- [ ] Report display page

**Weeks 9–11 (AI Integration):**
- [ ] FastAPI Python service setup
- [ ] Resume analysis agent (LangChain)
- [ ] Technical interview agent (question selection + evaluation)
- [ ] HR interview agent
- [ ] Whisper STT integration
- [ ] TTS integration
- [ ] Connect Spring Boot to Python AI

**Weeks 12–13 (Coding Round):**
- [ ] Docker-based code execution service
- [ ] Test case management
- [ ] Run vs Submit distinction
- [ ] AI coding feedback agent
- [ ] Monaco Editor ↔ Backend integration

**Weeks 14–15 (DevOps):**
- [ ] AWS EC2 provisioning + Tomcat setup
- [ ] AWS RDS MySQL setup
- [ ] AWS S3 bucket configuration + IAM roles
- [ ] Jenkins pipeline (GitHub webhook → build → deploy)
- [ ] Environment variables + secrets management
- [ ] SSL certificate setup

**Week 16 (Testing & Demo):**
- [ ] Full E2E test run (3 mock students through all rounds)
- [ ] Load test (50 concurrent sessions)
- [ ] Bug fixes
- [ ] Final deployment to production EC2
- [ ] Project documentation
- [ ] Demo video recording

---

## 20. Open Questions & Decisions

> [!IMPORTANT]
> These decisions need to be finalized before development begins.

### 20.1 LLM Provider
- **Option A:** OpenAI GPT-4o (Best quality, $0.005/1K tokens)
- **Option B:** Google Gemini Pro (Free tier available for students)
- **Option C:** Self-hosted Llama 3 on EC2 (Free but requires GPU instance)
- **Recommendation:** Start with Gemini Pro free tier; switch to GPT-4o for production

### 20.2 STT/TTS Provider
- **Option A:** OpenAI Whisper API ($0.006/minute) + OpenAI TTS
- **Option B:** Browser Web Speech API (Free, no backend STT) + gTTS
- **Recommendation:** Web Speech API for STT (browser-native, free), OpenAI TTS for question audio

### 20.3 Code Execution
- **Option A:** Build custom Docker sandbox (full control)
- **Option B:** Judge0 API (managed service, free tier: 50 req/day)
- **Recommendation:** Judge0 for MVP, custom Docker for production

### 20.4 Voice Recording Format
- Browser `MediaRecorder` outputs WebM/Opus
- Whisper accepts MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM
- WebM is directly compatible — no conversion needed

### 20.5 Frontend Hosting
- **Option A:** AWS S3 + CloudFront (Recommended for production)
- **Option B:** Serve from Tomcat as static files
- **Option C:** Vercel (Easiest for students)

### 20.6 PDF Generation
- **Option A:** iText 7 Community (Java, open source)
- **Option B:** JasperReports (Complex but powerful)
- **Option C:** Python WeasyPrint (HTML-to-PDF)
- **Recommendation:** iText 7 Community in Spring Boot

---

## Summary Table

| Category | Technology Choice |
|----------|------------------|
| Frontend | React 18 + Tailwind CSS 3 |
| Backend | Spring Boot 3.x + Java 21 |
| AI Service | Python 3.11 + FastAPI + LangChain |
| LLM | Google Gemini Pro / OpenAI GPT-4o |
| STT | OpenAI Whisper API |
| TTS | OpenAI TTS (nova voice) |
| Code Editor | Monaco Editor (VS Code engine) |
| Code Execution | Judge0 API / Docker sandbox |
| Database | MySQL 8 on AWS RDS |
| File Storage | AWS S3 |
| Auth | JWT (Spring Security) |
| PDF | iText 7 Community |
| CI/CD | Jenkins + Maven + GitHub |
| Deployment | AWS EC2 + Tomcat |
| Monitoring | AWS CloudWatch |
| Version Control | GitHub (main + dev + feature branches) |

---

*Document Version: 1.0*  
*Created: July 2025*  
*Project: TechWings AI Interview Assessment Platform*  
*Status: Ready for Phase 1 — Planning*
