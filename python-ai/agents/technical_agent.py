"""
Technical Interview Agent — generates role-specific questions and evaluates answers.
Supports 5 tracks: Java Full Stack, MERN Stack, AWS Cloud, DevOps, Generative AI.
"""
import json
import re
import random
from config import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# ─── ROLE-SPECIFIC TOPIC BANKS ────────────────────────────────────────────────
# Each role has curated sub-categories with specific topics.
# Used to generate diverse, high-quality questions per round.

ROLE_TOPICS = {
    "Java Full Stack Developer": {
        "Backend": [
            "Spring Boot REST API design and best practices",
            "Spring Security and JWT authentication flow",
            "JPA/Hibernate ORM and the N+1 query problem",
            "Spring transaction management and @Transactional",
            "Bean lifecycle, dependency injection, and Spring IOC container",
            "Exception handling with @ControllerAdvice and @ExceptionHandler",
            "Spring Boot auto-configuration and starter dependencies",
            "Microservices communication: REST vs messaging (Kafka/RabbitMQ)",
            "Database connection pooling with HikariCP",
            "Caching strategies with Spring Cache and Redis",
        ],
        "Frontend": [
            "React hooks: useState, useEffect, useContext, useRef, useMemo",
            "React state management: Context API vs Redux Toolkit",
            "React component re-rendering and performance optimization",
            "Async/await and Promises for API calls in React",
            "React Router v6 navigation and protected routes",
            "Custom hooks and when to create them",
        ],
        "Database": [
            "SQL joins: INNER, LEFT, RIGHT, FULL OUTER",
            "Database indexing strategies and query optimization",
            "Database normalization: 1NF, 2NF, 3NF",
            "ACID properties and database transactions",
            "MySQL vs PostgreSQL: key differences and use cases",
        ],
        "Core Engineering & Fresher Interviews": [
            "Object-Oriented Programming (OOP) concepts: Polymorphism, Inheritance, Encapsulation",
            "Java Collections Framework: HashMap internal working, ArrayList vs LinkedList",
            "Exception Handling in Java: Checked vs Unchecked exceptions, try-with-resources",
            "Multithreading fundamentals: Thread lifecycle, synchronization, deadlock scenarios",
            "String handling in Java: String vs StringBuilder vs StringBuffer, String Pool",
            "Design Patterns: Singleton, Factory, and Observer patterns in real projects",
            "Version Control: Git branching strategies, merge vs rebase, resolving conflicts",
            "REST API Fundamentals: HTTP methods (GET, POST, PUT, DELETE) and status codes",
            "Basic SQL queries: Joins, Group By, Subqueries, finding second highest salary",
            "Web security basics: CORS, XSS, CSRF, and how to prevent them",
            "Unit Testing: JUnit and Mockito basics for testing business logic",
            "Debugging techniques: Handling NullPointerException and analyzing stack traces",
            "Memory Management: Garbage collection process in Java, stack vs heap memory",
            "Clean Code: SOLID principles, DRY, KISS, and code readability",
            "Agile & SDLC: Understanding the software development lifecycle and sprints"
        ],
    },

    "MERN Stack Developer": {
        "MongoDB": [
            "MongoDB document model vs relational model trade-offs",
            "Mongoose schemas, validation, and pre/post middleware hooks",
            "MongoDB aggregation pipeline and common stages",
            "MongoDB indexing strategies for read performance",
            "When to use embedded documents vs document references",
            "MongoDB transactions and write concerns",
        ],
        "Node & Express": [
            "Node.js event loop, call stack, and non-blocking I/O",
            "Express.js middleware pipeline and error-handling middleware",
            "JWT authentication and refresh token flow in Node.js",
            "REST API design principles and HTTP status codes",
            "Async/await vs callbacks vs Promises in Node.js",
            "Environment variables, dotenv, and config management",
            "Rate limiting and security hardening for Express APIs",
        ],
        "React": [
            "React hooks and building custom hooks",
            "State management with Redux Toolkit and RTK Query",
            "React performance optimization: React.memo, lazy, Suspense",
            "React Router v6 navigation patterns and data loading",
            "Form handling with React Hook Form or Formik",
        ],
        "Core Engineering & Fresher Interviews": [
            "JavaScript Core: Let vs Var vs Const, Hoisting, and Scope",
            "JavaScript Asynchronous: Promises, Async/Await, Event Loop, and Callbacks",
            "JavaScript Concepts: Closures, Prototypes, and 'this' keyword",
            "Array and Object manipulation: map, filter, reduce, destructuring, spread operator",
            "Data Structures: How Hash Maps and Trees relate to JSON and DOM structures",
            "DOM Manipulation: Event bubbling, event delegation, and virtual DOM concepts",
            "Version Control: Git commands, resolving merge conflicts, branching",
            "REST API Fundamentals: Designing endpoints, HTTP status codes, payload formatting",
            "Web security basics: JWT structure, XSS prevention, CSRF tokens",
            "NoSQL basics: Difference between relational DBs and document-based DBs",
            "Unit Testing: Jest and React Testing Library basics for freshers",
            "Debugging techniques: Using Chrome DevTools, debugging Node.js applications",
            "Performance: Lazy loading, debouncing, throttling in JavaScript",
            "Clean Code: Component reusability, DRY principles, naming conventions",
            "Agile & SDLC: Understanding Git flow and sprint-based development"
        ],
    },

    "AWS Cloud Engineer": {
        "Compute": [
            "EC2 instance types and when to choose each family",
            "Auto Scaling Groups, Launch Templates, and scaling policies",
            "AWS Lambda functions, cold starts, and serverless patterns",
            "ECS vs EKS for container orchestration on AWS",
            "ALB vs NLB vs CLB: choosing the right load balancer",
        ],
        "Storage & Databases": [
            "S3 storage classes (Standard, IA, Glacier) and lifecycle policies",
            "S3 vs EBS vs EFS: choosing the right storage for the use case",
            "RDS Multi-AZ vs Read Replicas: availability vs performance",
            "ElastiCache for Redis vs Memcached: when to use each",
            "DynamoDB partition key design and GSI/LSI indexes",
            "RDS Aurora vs standard RDS: differences and benefits",
        ],
        "Networking & Security": [
            "VPC components: subnets, route tables, internet gateways, NAT gateways",
            "Security Groups vs NACLs: stateful vs stateless",
            "IAM roles, policies, and the principle of least privilege",
            "AWS CloudFront CDN: caching, origins, and behaviors",
            "Route 53 routing policies: simple, weighted, failover, latency",
        ],
        "Architecture": [
            "AWS Well-Architected Framework: 6 pillars explained",
            "High availability vs fault tolerance: designing for each",
            "Cost optimization strategies on AWS",
            "CloudFormation vs Terraform for infrastructure as code",
            "AWS WAF and Shield for application security",
        ],
        "Core Engineering & Fresher Interviews": [
            "Computer Networking basics: OSI model, TCP/IP, DNS, DHCP",
            "Network Protocols: HTTP/HTTPS, SSH, FTP, and standard ports",
            "Linux Fundamentals: Basic commands (ls, grep, chmod, tar), file permissions",
            "System Administration: Understanding processes, CPU/Memory monitoring (top, htop)",
            "Web Architecture: Client-server model, load balancing concepts, caching",
            "Database Fundamentals: Relational vs Non-Relational, scaling vertically vs horizontally",
            "Security Basics: Public/Private key cryptography, SSL/TLS handshakes",
            "Version Control: Git basics for managing infrastructure code",
            "Scripting skills: Bash or Python scripting for task automation",
            "Cloud Computing basics: IaaS vs PaaS vs SaaS, benefits of cloud over on-premise",
            "High Availability concepts: Redundancy, failover, disaster recovery",
            "Virtualization: Hypervisors, virtual machines vs containers",
            "Troubleshooting: How to trace network connectivity issues (ping, traceroute)",
            "Cost Awareness: Understanding OpEx vs CapEx in cloud environments",
            "Agile & SDLC: How cloud integrates with continuous integration and delivery"
        ],
    },

    "DevOps Engineer": {
        "Containers": [
            "Docker architecture: image, container, registry, daemon",
            "Dockerfile best practices: layer caching, multi-stage builds",
            "Docker Compose for multi-service development environments",
            "Kubernetes pods, deployments, services, and namespaces",
            "Kubernetes rolling updates, rollbacks, and health checks",
            "Helm charts for Kubernetes package management",
            "Kubernetes resource limits and horizontal pod autoscaling",
        ],
        "CI/CD": [
            "CI/CD pipeline design: stages, triggers, and artifacts",
            "GitHub Actions workflows: jobs, steps, secrets, environments",
            "Jenkins declarative pipeline syntax and shared libraries",
            "Blue-green deployment vs canary release strategies",
            "Artifact versioning and semantic versioning best practices",
            "GitOps principles and tools like ArgoCD or Flux",
        ],
        "Monitoring & Observability": [
            "Prometheus metrics collection and alerting rules",
            "Grafana dashboard design for infrastructure monitoring",
            "ELK stack: Elasticsearch, Logstash, Kibana for log aggregation",
            "Distributed tracing concepts and tools (Jaeger, Zipkin)",
            "SLI, SLO, and SLA definitions and practical implementation",
            "Incident response and runbooks",
        ],
        "Infrastructure as Code": [
            "Terraform state management and remote backends (S3, Terraform Cloud)",
            "Terraform modules, variables, and reusability",
            "Ansible playbooks, roles, and idempotency",
            "Infrastructure drift detection and remediation",
        ],
        "Core Engineering & Fresher Interviews": [
            "Linux Fundamentals: Core commands, file system hierarchy, permissions (chmod/chown)",
            "Shell Scripting: Bash scripting basics, loops, conditions, cron jobs",
            "Computer Networking: TCP/IP, DNS resolution, subnets, routing basics",
            "Version Control: Git workflows, branching, pull requests, resolving conflicts",
            "Software Development Lifecycle (SDLC): Waterfall vs Agile, role of DevOps",
            "Continuous Integration: What it is, why it's important, basic pipeline stages",
            "Containerization concepts: What is a container, how it differs from a VM",
            "Web Architecture: Reverse proxies, load balancers, HTTP status codes",
            "Security Basics: SSH keys, IAM principles, principle of least privilege",
            "Database Basics: Connecting to databases, backup strategies, SQL vs NoSQL",
            "Troubleshooting: Debugging application crashes, reading logs, checking disk space",
            "Automation mindset: Identifying manual tasks suitable for automation",
            "Infrastructure as Code (IaC) concepts: Declarative vs Imperative provisioning",
            "Monitoring basics: Difference between logging, metrics, and tracing",
            "Collaboration: Incident management and post-mortem culture in DevOps"
        ],
    },

    "Generative AI Engineer": {
        "LLM Fundamentals": [
            "Transformer architecture: self-attention and multi-head attention",
            "Tokens, embeddings, and vector space representations",
            "Temperature, top-p, and top-k: how they affect output diversity",
            "Context window limitations and strategies for long documents",
            "Hallucination: causes, detection, and mitigation techniques",
            "Prompt engineering: zero-shot, few-shot, and chain-of-thought",
        ],
        "RAG Systems": [
            "RAG architecture: retrieval-augmented generation end-to-end",
            "Vector databases: Pinecone, Chroma, Weaviate, FAISS — when to use each",
            "Embedding models: when to use OpenAI embeddings vs open-source alternatives",
            "Document chunking strategies: fixed-size vs semantic vs recursive",
            "Hybrid search: combining semantic search with BM25 keyword search",
            "RAG evaluation metrics: faithfulness, answer relevance, context precision",
        ],
        "Agents & Orchestration": [
            "LLM Agents and the ReAct (Reason + Act) pattern",
            "Tool use and function calling in LLMs",
            "LangChain vs LlamaIndex: differences and when to use each",
            "Memory types in agents: buffer, summary, entity, and knowledge graph",
            "Multi-agent systems: orchestrator-worker patterns",
            "Agent evaluation and testing strategies",
        ],
        "Fine-Tuning & Production": [
            "When to fine-tune vs RAG vs prompt engineering: decision framework",
            "LoRA and QLoRA: parameter-efficient fine-tuning explained",
            "RLHF: reinforcement learning from human feedback overview",
            "Dataset preparation and quality for fine-tuning",
            "LLM deployment: vLLM, TGI, and serving frameworks",
            "Guardrails and safety in production LLM applications",
        ],
        "Core Engineering & Fresher Interviews": [
            "Python Fundamentals: Data structures (Lists, Dictionaries, Sets), list comprehensions",
            "Python Advanced: Generators, decorators, lambda functions, OOP in Python",
            "Data Science Basics: Pandas, NumPy, data cleaning, and preprocessing",
            "Machine Learning Basics: Supervised vs Unsupervised learning, Overfitting vs Underfitting",
            "Neural Networks 101: Activation functions, backpropagation, epochs, batch size",
            "Math for AI: Linear algebra basics (vectors, matrices), basic probability/statistics",
            "Natural Language Processing (NLP): Tokenization, stemming, lemmatization, stop words",
            "Word Embeddings: TF-IDF vs Word2Vec vs contextual embeddings",
            "Version Control for Data: Git basics, Jupyter notebook versioning challenges",
            "API Development: Exposing AI models via REST APIs (FastAPI/Flask basics)",
            "Prompting Basics: Zero-shot vs few-shot prompting, system instructions",
            "Database Basics: SQL for data extraction, intro to vector representations",
            "Model Evaluation: Accuracy, Precision, Recall, F1-Score definitions",
            "Ethics in AI: Bias in training data, hallucination, model fairness",
            "Agile & SDLC: Managing ML experiments and transitioning to production",
            "Software Testing & QA: Unit testing, integration testing, TDD, and test automation (Jest/PyTest/JUnit)"
        ],
    }
}


# ─── QUESTION GENERATION ──────────────────────────────────────────────────────

GENERATE_PROMPT = ChatPromptTemplate.from_template("""
You are Alex, a senior technical interviewer at TechWing — a professional AI interview platform.
You are interviewing a candidate for the role of: {role_name}

The candidate's resume lists these technical skills: {resume_skills}

Core topics for this role that you MUST draw from for role-based questions:
{role_topics}

Generate exactly {count} technical interview questions following this strict structure:
- Questions 1-5: Based ENTIRELY on the candidate's RESUME SKILLS above. Test depth of knowledge on what they claim to know. Ask about specific technologies from their resume.
- Questions 6-10: Based ENTIRELY on the ROLE TOPICS above. Sample from different topic categories. Mix difficulties.

{randomness_constraint}

RULES:
1. Questions must be conceptual and open-ended — this is a VOICE interview, no code writing.
2. CRITICAL: The "question_text" MUST be extremely short, conversational, and direct (maximum 1 or 2 short sentences). Do NOT include long scenarios, examples, or background context in the question text. Keep it simple.
3. Each question needs a detailed expected answer (4-6 sentences, technically precise).
4. Difficulty must be exactly: "EASY", "MEDIUM", or "HARD".
5. Category must be the relevant sub-area.
6. Never repeat questions that are too similar to each other.
7. Make questions practical — ask about real-world usage and trade-offs, but keep the phrasing brief.

Return ONLY a valid JSON array with no markdown:
[
  {{
    "question_text": "Explain how...",
    "expected_answer": "A complete answer should cover...",
    "difficulty": "MEDIUM",
    "category": "Backend"
  }}
]
""")

def generate_technical_questions(role_name: str, resume_skills: list, count: int = 10) -> list:
    """
    Generate role-specific technical interview questions.
    5 resume-based + 5 role-based questions for the given track.
    """
    llm = get_llm()
    chain = GENERATE_PROMPT | llm | StrOutputParser()

    # Get role-specific topics
    role_config = ROLE_TOPICS.get(role_name, {})
    all_topics = []
    for category, topics in role_config.items():
        # Pick a random subset from each category for variety
        sampled = random.sample(topics, min(3, len(topics)))
        for t in sampled:
            all_topics.append(f"[{category}] {t}")

    random.shuffle(all_topics)
    role_topics_str = "\n".join(f"  - {t}" for t in all_topics)
    
    # Shuffle resume skills as well so the LLM doesn't always see them in the same order
    random.shuffle(resume_skills)
    skills_str = ", ".join(resume_skills[:12]) if resume_skills else "General technical skills"

    random_constraints = [
        "CRITICAL: Start the interview with an incredibly unique scenario-based question, not a standard definition.",
        "CRITICAL: Pick a random skill from the middle of the resume list to ask the first question about, not the first one.",
        "CRITICAL: Frame the first question as a tricky debugging problem rather than a standard theoretical question.",
        "CRITICAL: Focus the very first question on performance optimization and trade-offs.",
        "CRITICAL: Ensure the questions are highly varied and completely different from a standard boilerplate interview. Shuffle the order!"
    ]
    randomness_constraint = random.choice(random_constraints)

    raw = chain.invoke({
        "role_name": role_name,
        "resume_skills": skills_str,
        "role_topics": role_topics_str,
        "count": count,
        "randomness_constraint": randomness_constraint
    })

    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        result = json.loads(raw)
        # Handle both array and object responses from LLM
        if isinstance(result, dict):
            for key in ["questions", "data", "items"]:
                if key in result:
                    result = result[key]
                    break
            else:
                result = list(result.values())[0] if result else []
        return result[:count]
    except json.JSONDecodeError as e:
        print(f"JSON parse error in generate_technical_questions: {e}")
        print(f"Raw output: {raw[:200]}")
        return []


# ─── ANSWER EVALUATION ────────────────────────────────────────────────────────

EVAL_PROMPT = ChatPromptTemplate.from_template("""
You are Alex, a senior technical interviewer at TechWing. You are doing a VOICE interview.

Role: {technology}
Question: {question_text}
Expected key points: {expected_answer}
Candidate's answer: {transcribed_answer}

Return ONLY valid JSON — no markdown, no extra text:
{{
  "score": <float 1.0-10.0>,
  "accuracy_score": <float 1.0-10.0>,
  "depth_score": <float 1.0-10.0>,
  "communication_score": <float 1.0-10.0>,
  "feedback": "<EXACTLY 1 short sentence spoken aloud. Vary your openers: 'Good answer.', 'I see.', 'Noted.', 'Interesting.', 'Thank you.' — then 1 brief comment. DO NOT say 'completely fine' repeatedly.>",
  "follow_up_hint": "<one word topic>"
}}

Rules:
- Score 9-10: complete, nuanced answer
- Score 7-8: good, minor gaps
- Score 5-6: basic, lacks depth
- Score 3-4: significant gaps
- Score 1-2: wrong, empty, or "I don't know"
- If "I don't know", empty, or wrong: score 1-2, provide a 1-sentence supportive, conversational response acknowledging it before moving on (e.g. "That's perfectly fine, this is a tricky concept. Usually it involves..." or "Not quite, but don't worry. Let's move on."). DO NOT just say 'Alright, let's move on.'
- If off-topic/making a joke: score 1, feedback like "That's funny, but let's stay focused on the interview for now."
""")

def evaluate_answer(question_text: str, expected_answer: str,
                    transcribed_answer: str, technology: str) -> dict:
    """
    Evaluate a candidate's answer. Returns detailed scoring breakdown.
    The 'feedback' field is designed to be spoken aloud by the TTS engine.
    """
    llm = get_llm()
    chain = EVAL_PROMPT | llm | StrOutputParser()
    raw = chain.invoke({
        "question_text": question_text,
        "expected_answer": expected_answer,
        "transcribed_answer": transcribed_answer,
        "technology": technology
    })
    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        result = json.loads(raw)
        return {
            "score": float(result.get("score", 5.0)),
            "accuracy_score": float(result.get("accuracy_score", 5.0)),
            "depth_score": float(result.get("depth_score", 5.0)),
            "communication_score": float(result.get("communication_score", 5.0)),
            "feedback": result.get("feedback", "Thank you for your answer. Let's move to the next question."),
            "follow_up_hint": result.get("follow_up_hint", "")
        }
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Error parsing evaluation response: {e}")
        return {
            "score": 5.0,
            "accuracy_score": 5.0,
            "depth_score": 5.0,
            "communication_score": 5.0,
            "feedback": "Thank you for your answer. Let's continue to the next question.",
            "follow_up_hint": ""
        }


