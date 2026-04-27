pipeline {
    agent any
    stages {
        stage('Verificación') {
            steps {
                echo '✅ Jenkins OK'
                sh 'docker --version'
                sh 'docker ps'
                sh 'node --version'
                sh 'python3 --version'
                sh 'sonar-scanner --version'
            }
        }
    }
}
