# 🚀 Jenkins Pipeline Setup Guide
### Techwing AI Interview Platform — Freestyle → Pipeline Migration

> **Tech Stack:** AWS EC2 · Jenkins · Maven · Tomcat · SonarQube · Nginx · GitHub Webhooks · React (Vite) · Spring Boot

---

## 📋 Table of Contents

1. [Prerequisites & Verification](#1-prerequisites--verification)
2. [Install Required Jenkins Plugins](#2-install-required-jenkins-plugins)
3. [Configure SonarQube in Jenkins](#3-configure-sonarqube-in-jenkins)
4. [Configure Maven in Jenkins](#4-configure-maven-in-jenkins)
5. [Add GitHub Credentials to Jenkins](#5-add-github-credentials-to-jenkins)
6. [Create the Pipeline Job](#6-create-the-pipeline-job)
7. [Configure GitHub Webhook](#7-configure-github-webhook)
8. [Verify sudoers Permission on EC2](#8-verify-sudoers-permission-on-ec2)
9. [Understanding Your Jenkinsfile](#9-understanding-your-jenkinsfile)
10. [Run the Pipeline](#10-run-the-pipeline)
11. [Troubleshooting Common Errors](#11-troubleshooting-common-errors)

---

## 1. Prerequisites & Verification

Before starting, verify everything is installed and running on your EC2 instance.

### 1.1 SSH into your EC2 instance

```bash
ssh -i your-key.pem ec2-user@<your-ec2-public-ip>
```

### 1.2 Verify all services are running

```bash
# Check Jenkins
sudo systemctl status jenkins

# Check Tomcat
sudo systemctl status tomcat

# Check SonarQube
sudo systemctl status sonarqube
# OR (if running as a service)
sudo /opt/sonarqube/bin/linux-x86-64/sonar.sh status

# Check Nginx
sudo systemctl status nginx
```

### 1.3 Verify tools are installed

```bash
# Java
java -version
# Expected: openjdk version "17.x.x"

# Maven
mvn -version
# Expected: Apache Maven 3.x.x

# Node and npm
node -v
npm -v
# Expected: Node v18+ and npm v9+

# Git
git --version
```

### 1.4 Verify Nginx root directory exists

```bash
ls -la /var/www/techwing
# If it does not exist, create it:
sudo mkdir -p /var/www/techwing
sudo chown -R nginx:nginx /var/www/techwing
```

---

## 2. Install Required Jenkins Plugins

### 2.1 Open Jenkins Dashboard

Go to: `http://<your-ec2-public-ip>:8080`

Login with your Jenkins admin credentials.

### 2.2 Navigate to Plugin Manager

```
Jenkins Dashboard
  → Manage Jenkins          (left sidebar)
    → Plugins               (in the System section)
      → Available Plugins   (top tab)
```

### 2.3 Search and Install these plugins

Search each one in the search box and check the checkbox:

| # | Plugin Name | Why Needed |
|---|-------------|------------|
| 1 | Pipeline | Core plugin — enables Pipeline job type |
| 2 | Pipeline: Stage View | Shows visual stage progress in the job |
| 3 | Git | For the git step in Checkout stage |
| 4 | GitHub Integration | For GitHub webhook trigger |
| 5 | SonarQube Scanner | For withSonarQubeEnv('sonar') in Jenkinsfile |
| 6 | Maven Integration | For Maven build steps |
| 7 | Credentials Binding | For storing GitHub/SonarQube tokens securely |

### 2.4 Install the plugins

- Click **"Install"** button (bottom of page)
- Check **"Restart Jenkins when installation is complete and no jobs are running"**
- Wait for Jenkins to restart

---

## 3. Configure SonarQube in Jenkins

> Your Jenkinsfile uses `withSonarQubeEnv('sonar')` — the name inside quotes MUST match exactly what you configure here.

### 3.1 Get SonarQube Token

1. Open SonarQube: `http://<your-ec2-public-ip>:9000`
2. Login → Click your **profile icon** (top right) → **My Account**
3. Go to **Security** tab
4. Under **"Generate Tokens"**:
   - Name: `jenkins-sonar-token`
   - Type: `Global Analysis Token`
   - Expiry: `No expiration`
5. Click **Generate**
6. **Copy the token immediately** (you will not see it again)

### 3.2 Add SonarQube Token to Jenkins Credentials

```
Jenkins Dashboard
  → Manage Jenkins
    → Credentials
      → System
        → Global credentials (unrestricted)
          → Add Credentials
```

Fill in:
- **Kind**: `Secret text`
- **Secret**: `<paste your sonar token here>`
- **ID**: `sonar-token`
- **Description**: `SonarQube Analysis Token`

Click **Create**.

### 3.3 Configure SonarQube Server in Jenkins

```
Jenkins Dashboard
  → Manage Jenkins
    → Configure System
      → (scroll down to) SonarQube Servers section
```

- Click **"Add SonarQube"**
- **Name**: `sonar`  ← MUST be exactly this — matches your Jenkinsfile
- **Server URL**: `http://localhost:9000`  (since SonarQube is on same EC2)
- **Server authentication token**: Select `sonar-token` (the one you just added)

Click **Save**.

---

## 4. Configure Maven in Jenkins

### 4.1 Find Maven installation path on EC2

```bash
which mvn
# Example output: /usr/bin/mvn

mvn -version
# Example output: Apache Maven 3.9.x ... Java home: /usr/lib/jvm/java-17...
```

### 4.2 Add Maven in Jenkins Global Tool Configuration

```
Jenkins Dashboard
  → Manage Jenkins
    → Tools
      → (scroll to) Maven installations
        → Add Maven
```

Fill in:
- **Name**: `Maven`
- Uncheck **"Install automatically"**
- **MAVEN_HOME**: `/usr/share/maven`  (or the path from `which mvn` above)

Click **Save**.

---

## 5. Add GitHub Credentials to Jenkins

> Needed so Jenkins can clone your GitHub repository.

### 5.1 Create a GitHub Personal Access Token (PAT)

1. Go to GitHub → Your profile → **Settings**
2. Scroll down → **Developer Settings** → **Personal access tokens** → **Tokens (classic)**
3. Click **"Generate new token (classic)"**
4. Give it a name: `jenkins-techwing`
5. Select scopes:
   - repo (Full control of private repositories)
   - admin:repo_hook (For webhook management)
6. Click **Generate token**
7. **Copy the token immediately**

### 5.2 Add GitHub Credentials to Jenkins

```
Jenkins Dashboard
  → Manage Jenkins
    → Credentials
      → System
        → Global credentials (unrestricted)
          → Add Credentials
```

Fill in:
- **Kind**: `Username with password`
- **Username**: `your-github-username`
- **Password**: `<paste your GitHub PAT here>`
- **ID**: `github-creds`
- **Description**: `GitHub PAT for Techwing Repo`

Click **Create**.

---

## 6. Create the Pipeline Job

This is the MOST IMPORTANT step — creating the Pipeline job that replaces your Freestyle job.

### 6.1 Create New Item

```
Jenkins Dashboard
  → New Item  (top left)
```

- **Item name**: `techwing-pipeline`
- Select: **Pipeline**  ← NOT Freestyle Project
- Click **OK**

### 6.2 General Configuration

In the **General** tab:

- Check **"GitHub project"**
- **Project url**: `https://github.com/Techwing-insurance/techwing-ai-interview`

### 6.3 Build Triggers

In the **Build Triggers** tab:

- Check **"GitHub hook trigger for GITScm polling"**

> This means every time you push to GitHub, the webhook will trigger this pipeline automatically.

### 6.4 Pipeline Definition — THE KEY STEP

In the **Pipeline** tab:

- **Definition**: Change dropdown to → `Pipeline script from SCM`

Now fill in:

| Field | Value |
|-------|-------|
| SCM | Git |
| Repository URL | `https://github.com/Techwing-insurance/techwing-ai-interview.git` |
| Credentials | Select `github-creds` (the one you added in Step 5) |
| Branch Specifier | `*/main` |
| Repository browser | `(Auto)` |
| Script Path | `Jenkinsfile` |

> IMPORTANT: Script Path tells Jenkins to look for a file named `Jenkinsfile` in the root of the repo. Your file is already there.

- Check **"Lightweight checkout"**

Click **Save**.

---

## 7. Configure GitHub Webhook

The webhook tells GitHub to notify Jenkins whenever code is pushed.

### 7.1 Open your GitHub Repository

Go to: `https://github.com/Techwing-insurance/techwing-ai-interview`

```
Repository → Settings (top tab)
  → Webhooks (left sidebar)
    → Add webhook
```

### 7.2 Webhook Settings

| Field | Value |
|-------|-------|
| Payload URL | `http://<your-ec2-public-ip>:8080/github-webhook/` |
| Content type | `application/json` |
| Secret | (leave blank or add one for security) |
| Which events? | Just the push event |
| Active | Checked |

Click **"Add webhook"**.

### 7.3 Verify Webhook is Working

After saving, GitHub will send a ping. You should see a green checkmark next to the webhook.

> Make sure port 8080 is open in your AWS EC2 Security Group for inbound traffic.

---

## 8. Verify sudoers Permission on EC2

Your Jenkinsfile uses `sudo systemctl` and `sudo cp` commands. Jenkins runs as the `jenkins` user, so it needs passwordless sudo for specific commands.

### 8.1 Check current sudoers

```bash
sudo visudo
# OR
sudo cat /etc/sudoers.d/jenkins
```

### 8.2 Add Jenkins sudoers rule

```bash
sudo visudo -f /etc/sudoers.d/jenkins
```

Add this line:

```
jenkins ALL=(ALL) NOPASSWD: /bin/systemctl, /bin/cp, /bin/rm, /bin/chown, /bin/chmod
```

Save and exit.

### 8.3 Verify Jenkins user

```bash
# Check jenkins user exists
id jenkins

# Check jenkins home directory
echo ~jenkins
# Expected: /var/lib/jenkins
```

---

## 9. Understanding Your Jenkinsfile

Your Jenkinsfile at the root of the project already has all 7 stages:

```
techwing-ai-interview/Jenkinsfile
```

### Pipeline Flow

```
Stage 1: Checkout
  → Clones the 'main' branch from GitHub

Stage 2: Build Backend (Maven)
  → mvn clean package -DskipTests
  → Creates ROOT.war in /target/

Stage 3: SonarQube Analysis
  → Scans Java code using SonarQube
  → Project key: techwing-ai-interview

Stage 4: Quality Gate
  → Waits up to 5 minutes for SonarQube result
  → abortPipeline: false = continues even if quality gate fails

Stage 5: Deploy Backend to Tomcat
  → Stops Tomcat
  → Copies ROOT.war to /opt/tomcat/webapps/
  → Starts Tomcat

Stage 6: Build Frontend (React)
  → cd frontend/ → npm install → npm run build
  → Creates /frontend/dist/ folder

Stage 7: Deploy Frontend to Nginx
  → Clears /var/www/techwing/
  → Copies dist/* to /var/www/techwing/
  → Sets nginx:nginx ownership
  → Reloads Nginx
```

### Environment Variables in Jenkinsfile

```groovy
environment {
    TOMCAT_URL  = 'http://localhost:8080'
    NGINX_ROOT  = '/var/www/techwing'      // Nginx serves from here
}
```

> No changes needed to the Jenkinsfile. It is already complete and correct.

---

## 10. Run the Pipeline

### 10.1 Manual First Run

After creating the job:

```
Jenkins Dashboard
  → techwing-pipeline
    → Build Now  (left sidebar)
```

### 10.2 Monitor the Pipeline

Click on the build number (e.g., `#1`) → Click **"Console Output"** to see live logs.

Or click **"Stage View"** to see a visual pipeline board:

```
[ Checkout ] → [ Build Backend ] → [ SonarQube ] → [ Quality Gate ] → [ Deploy Backend ] → [ Build Frontend ] → [ Deploy Frontend ]
    PASS            PASS              PASS              PASS               PASS                 PASS                   PASS
```

### 10.3 Automatic Trigger via GitHub Push

After the webhook is set up, any `git push` to the `main` branch will automatically trigger the pipeline:

```bash
# On your local machine
git add .
git commit -m "trigger pipeline test"
git push origin main
```

Jenkins will automatically start a new build within seconds.

### 10.4 Verify Deployment

After a successful build, verify:

```bash
# On EC2 — Check Tomcat is running with new WAR
sudo systemctl status tomcat
ls -la /opt/tomcat/webapps/ROOT.war

# Check Nginx is serving frontend
ls -la /var/www/techwing/
curl http://localhost

# Check app health
curl http://localhost:8080/actuator/health
```

Open your browser: `https://techwingai.duckdns.org`

---

## 11. Troubleshooting Common Errors

### ERROR: withSonarQubeEnv: No SonarQube server configured

**Cause**: SonarQube server name does not match
**Fix**: Go to `Manage Jenkins → Configure System → SonarQube Servers` and make sure the name is exactly `sonar` (lowercase)

---

### ERROR: mvn: command not found

**Cause**: Maven is not in the PATH for Jenkins user
**Fix**:
```bash
# Find maven path
which mvn

# Add to Jenkins environment
sudo nano /etc/environment
# Add: PATH="/usr/share/maven/bin:..."
```

---

### ERROR: npm: command not found

**Cause**: Node/npm not installed for Jenkins user
**Fix**:
```bash
# Install Node.js on EC2 (Amazon Linux)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify
node -v && npm -v
```

---

### ERROR: sudo: no tty present and no askpass program specified

**Cause**: Jenkins user does not have passwordless sudo
**Fix**: Redo Step 8 and verify the sudoers file is correct

---

### ERROR: Authentication failed for 'https://github.com...'

**Cause**: GitHub credentials missing or expired
**Fix**: Regenerate GitHub PAT and update credentials in `Manage Jenkins → Credentials`

---

### ERROR: Permission denied: /var/www/techwing

**Cause**: The nginx root directory has wrong permissions
**Fix**:
```bash
sudo mkdir -p /var/www/techwing
sudo chown -R jenkins:jenkins /var/www/techwing
sudo chmod -R 755 /var/www/techwing
```

---

### ERROR: Quality Gate timeout

**Cause**: SonarQube webhook to Jenkins not configured
**Fix**:
1. Go to SonarQube → **Administration → Configuration → Webhooks**
2. Add webhook:
   - Name: `jenkins`
   - URL: `http://localhost:8080/sonarqube-webhook/`
3. Click **Save**

---

## Final Checklist

Before you consider the migration complete, verify:

- [ ] All Jenkins plugins are installed (Pipeline, Git, SonarQube Scanner, etc.)
- [ ] SonarQube server named `sonar` is configured in Jenkins
- [ ] GitHub credentials (`github-creds`) are added to Jenkins
- [ ] SonarQube webhook is added pointing back to Jenkins
- [ ] Pipeline job `techwing-pipeline` is created with "Pipeline script from SCM"
- [ ] Branch is set to `*/main`
- [ ] Script Path is `Jenkinsfile`
- [ ] GitHub Webhook is set to `http://<ec2-ip>:8080/github-webhook/`
- [ ] Jenkins user has passwordless sudo for systemctl, cp, rm, chown, chmod
- [ ] `/var/www/techwing` directory exists and is writable
- [ ] First manual build succeeds
- [ ] Push to GitHub triggers automatic build
- [ ] App is accessible at `https://techwingai.duckdns.org`

---

## Freestyle vs Pipeline Comparison

| Feature | Freestyle Job | Pipeline Job |
|---------|--------------|--------------|
| Configuration | Jenkins UI | Jenkinsfile in repo |
| Version Control | No | Yes — tracked in Git |
| Code Review | No | Yes — via Pull Requests |
| Stage Visualization | No | Yes — Stage View |
| Retry failed stages | No | Yes |
| Parallel execution | Limited | Fully supported |
| Audit trail | Jenkins logs only | Git history + Jenkins |
| Reusable logic | No | Yes — Shared Libraries |

---

*Guide created for: Techwing AI Interview Platform*
*Deployment URL: https://techwingai.duckdns.org*
*Repository: https://github.com/Techwing-insurance/techwing-ai-interview*
