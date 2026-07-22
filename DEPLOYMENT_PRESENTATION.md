# Techwing AI Interview Platform - Deployment Architecture
**Presentation Outline & Content**

---

## Slide 1: Title Slide
**Title:** Techwing AI Interview Platform: CI/CD & Deployment Architecture
**Subtitle:** Streamlining our Build, Quality, and Release Pipelines
**Speaker/Presenter:** [Your Name/Team Name]

---

## Slide 2: High-Level Architecture Overview
**Heading:** The Big Picture
**Bullet Points:**
*   **Infrastructure:** Hosted on AWS EC2 instances.
*   **Version Control:** GitHub for source code management.
*   **CI/CD Engine:** Jenkins orchestrating the entire lifecycle via automated jobs.
*   **Backend Stack:** Spring Boot built with Maven, deployed as a `.war` to Apache Tomcat.
*   **Frontend Stack:** React.js built with Node/npm, served statically via Nginx.
*   **Quality & Storage:** SonarQube for code analysis and Nexus for artifact repository management.

---

## Slide 3: Deployment Flowchart (Visual)
*(Copy this diagram or create a visual flowchart in PPT based on it)*

```mermaid
graph TD
    Developer([Developer]) -->|git push| GitHub[(GitHub Repository)]
    GitHub -->|Webhook Trigger| Jenkins[[Jenkins CI/CD Server]]
    
    subgraph Jenkins Pipeline
        Jenkins -->|1. Clone Code| Workspace
        Workspace -->|2. mvn clean package| Maven[Maven Build]
        Maven -->|ROOT.war| SonarScan[SonarQube Scanner]
    end

    SonarScan -->|3. Analyze Code| SonarQube[(SonarQube Server)]
    SonarQube -.->|Quality Gate Pass/Fail| Jenkins
    
    Jenkins -->|4. Upload Artifact| Nexus[(Nexus Repository Manager)]
    
    subgraph Target Deployment Environment
        Nexus -->|5. Download ROOT.war| Tomcat[Apache Tomcat Server]
        Workspace -->|6. npm build & copy| Nginx[Nginx Web Server]
    end
    
    Tomcat -.->|Serves API| User([End User])
    Nginx -.->|Serves UI| User
```

---

## Slide 4: Control Flow Diagram (Sequence)
**Heading:** How Control Moves Through the Pipeline

*(Copy this diagram or create a visual sequence diagram in PPT based on it)*

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub (main)
    participant Jnk as Jenkins CI/CD
    participant Mvn as Maven (Build)
    participant Sq as SonarQube (9000)
    participant Nx as Nexus (8085)
    participant EC2 as Target EC2 (Tomcat/Nginx)

    %% 1. Trigger Phase
    Note over Dev,Jnk: 1. Trigger Phase
    Dev->>Git: git push (code updates)
    Git-->>Jnk: Webhook Trigger (JSON Payload)
    
    %% 2. Build & Analyze Phase
    Note over Jnk,Sq: 2. Build & Analyze Phase
    Jnk->>Jnk: Clone latest codebase
    Jnk->>Mvn: Compile & Package (skip tests)
    Mvn-->>Jnk: Output: ROOT.war
    Jnk->>Sq: Push code for analysis (SonarScanner)
    Sq-->>Jnk: Return Quality Gate Status (Wait)
    
    %% 3. Storage & Deployment Phase
    Note over Jnk,EC2: 3. Storage & Deployment Phase
    alt Quality Gate Fails
        Jnk-->>Dev: Pipeline Aborts / Fails
    else Quality Gate Passes
        Jnk->>Nx: Upload ROOT.war (Versioned)
        Nx-->>Jnk: Artifact Stored Successfully
        
        %% Backend Deploy
        Jnk->>EC2: Stop Tomcat
        Jnk->>Nx: Download latest ROOT.war
        Nx-->>EC2: Transfer ROOT.war to webapps/
        Jnk->>EC2: Start Tomcat (Backend Live)
        
        %% Frontend Deploy
        Jnk->>Jnk: Build React App (npm install & run build)
        Jnk->>EC2: Copy static files to /var/www/techwing
        Jnk->>EC2: Reload Nginx (Frontend Live)
    end
```

---

## Slide 5: Code Quality Assurance (SonarQube)
**Heading:** Ensuring Clean & Secure Code
**Bullet Points:**
*   **Integration:** Triggered automatically post-build via Maven (`mvn sonar:sonar`).
*   **What it does:** 
    *   Detects hard-coded secrets (Security Hotspots).
    *   Identifies Code Smells (maintainability issues).
    *   Finds potential bugs.
*   **Quality Gates:** Acts as a checkpoint; if the code is severely flawed, the pipeline is flagged, preventing bad code from reaching production.

---

## Slide 6: Artifact Management (Nexus)
**Heading:** Versioning & Storing Releases
**Bullet Points:**
*   **Role:** Acts as our single source of truth for compiled binaries (WAR files).
*   **Repository Type:** Hosted Maven2 Repository (`techwing-releases`).
*   **Workflow:** 
    *   Jenkins uploads the artifact tagged with the Jenkins `${BUILD_NUMBER}`.
    *   During deployment, Tomcat doesn't build the code; it downloads the pre-built, verified artifact from Nexus.
*   **Benefits:** Easy rollbacks, traceability, and separation of the build process from the deployment process.

---

## Slide 7: Benefits of this Architecture
**Heading:** Why We Built It This Way
**Bullet Points:**
*   **Zero-Touch Deployments:** Code pushed to GitHub automatically goes live if it passes all checks.
*   **Traceability:** Every release in Nexus maps directly to a Jenkins build number and Git commit.
*   **High Quality:** SonarQube prevents technical debt and security vulnerabilities from compounding.
*   **Scalable & Modular:** The frontend, backend, and artifact storage are distinct components that can be scaled independently.

---

## Slide 8: Q&A
**Title:** Questions?
**Subtitle:** Thank you for your time.
