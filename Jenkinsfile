pipeline {
    agent any

    environment {
        TOMCAT_URL  = 'http://localhost:8080'
        NGINX_ROOT  = '/var/www/techwing'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Techwing-insurance/techwing-ai-interview.git'
            }
        }

        stage('Build Backend (Maven)') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }

        stage('Deploy Backend to Tomcat') {
            steps {
                sh '''
                    sudo systemctl stop tomcat || true
                    sudo cp target/*.war /opt/tomcat/webapps/ROOT.war
                    sudo systemctl start tomcat
                '''
            }
        }

        stage('Build Frontend (React)') {
            steps {
                dir('frontend') {
                    sh '''
                        npm install
                        npm run build
                    '''
                }
            }
        }

        stage('Deploy Frontend to Nginx') {
            steps {
                sh '''
                    sudo rm -rf ${NGINX_ROOT}/*
                    sudo cp -r frontend/dist/* ${NGINX_ROOT}/
                    sudo chown -R nginx:nginx ${NGINX_ROOT}/
                    sudo chmod -R 755 ${NGINX_ROOT}/
                    sudo systemctl reload nginx
                '''
            }
        }

    }

    post {
        success {
            echo '✅ Deployment complete! https://techwingai.duckdns.org'
        }
        failure {
            echo '❌ Build failed. Check logs above.'
        }
    }
}
