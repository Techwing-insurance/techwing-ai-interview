pipeline {
    agent any

    environment {
        TOMCAT_URL  = 'http://localhost:8081'
        TOMCAT_HOME = '/root/apache-tomcat-10.1.56'
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
                    ${TOMCAT_HOME}/bin/shutdown.sh || true
                    sleep 5
                    sudo cp target/*.war ${TOMCAT_HOME}/webapps/ROOT.war
                    ${TOMCAT_HOME}/bin/startup.sh
                    sleep 10
                '''
            }
        }

        stage('Build Frontend (React)') {
            steps {
                dir('frontend') {
                    sh '''
                        export PATH=$PATH:/usr/bin
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
            echo '✅ Deployment complete! https://techwing-ai-interview.duckdns.org'
        }
        failure {
            echo '❌ Build failed. Check logs above.'
        }
    }
}
