# Reto 6 – Integración Continua con Jenkins

## Contexto

Este reto continúa el desarrollo del sistema de onboarding y offboarding de empleados.

Hasta ahora, se ha construido un sistema distribuido con:

- Servicios de negocio con persistencia y comunicación REST (Retos 1 y 2)
- Comunicación asincrónica basada en eventos (Reto 3)
- Seguridad centralizada con JWT y RBAC (Reto 4)
- Pruebas funcionales automatizadas con BDD (Reto 5)

A lo largo de los retos anteriores, cada equipo ha compilado, probado y desplegado sus microservicios de forma manual: ejecutando comandos de build localmente, corriendo pruebas en la terminal, y construyendo imágenes Docker a mano.

Cuando un miembro del equipo introduce un cambio que rompe el build o las pruebas de otro servicio, el problema se descubre tarde — a veces solo cuando alguien ejecuta `docker-compose up` y el sistema falla.

En este reto se implementará un pipeline de Integración Continua (CI) utilizando Jenkins, de modo que cada cambio en el código sea automáticamente compilado, probado y empaquetado, detectando problemas en minutos, no en días.

---

# Objetivo

Configurar un entorno de Integración Continua con Jenkins dentro del ecosistema Docker del proyecto.

Cada microservicio debe contar con un `Jenkinsfile` que defina un pipeline automatizado con las etapas de:

- build
- test
- calidad
- empaquetado Docker

---

# ¿Qué es la Integración Continua?

La Integración Continua (CI – Continuous Integration) es una práctica de desarrollo de software en la que los desarrolladores integran su código en un repositorio compartido de forma frecuente, y cada integración se verifica automáticamente mediante compilación y pruebas.

| Aspecto | Sin CI | Con CI |
|---|---|---|
| Compilación | Manual | Automática |
| Pruebas | Locales o inexistentes | Automáticas |
| Detección de errores | Tardía | Temprana |
| Confianza en el código | “En mi máquina funciona” | Verificado |
| Empaquetado | Manual | Automático |

---

# Jenkins

Jenkins es un servidor de automatización open-source utilizado para implementar pipelines CI/CD.

## Características

- Open Source
- Pipeline as Code
- Integración con Docker
- Multi-lenguaje
- Ecosistema de plugins

---

# Pipeline Declarativo

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                // Compilar proyecto
            }
        }

        stage('Test') {
            steps {
                // Ejecutar pruebas
            }
        }

        stage('Package') {
            steps {
                // Construir imagen Docker
            }
        }
    }

    post {
        always {
            // Limpieza
        }
    }
}
```

---

# Jenkins en Docker

## Dockerfile Jenkins

```dockerfile
FROM jenkins/jenkins:lts-jdk17

RUN jenkins-plugin-cli --plugins \
    docker-pipeline \
    docker-workflow \
    pipeline-stage-view \
    workflow-aggregator \
    git \
    configuration-as-code \
    sonar

USER root

RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -f docker && usermod -aG docker jenkins

USER jenkins
```

---

# docker-compose.yml

```yaml
services:
  jenkins:
    build:
      context: ./jenkins
      dockerfile: Dockerfile

    container_name: jenkins

    ports:
      - "9090:8080"
      - "50000:50000"

    volumes:
      - jenkins_data:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock

    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false

    networks:
      - microservices-network

volumes:
  jenkins_data:
```

---

# Punto 1 – Configuración Jenkins

## Objetivos

1. Crear directorio `jenkins/`
2. Crear Dockerfile personalizado
3. Instalar plugins automáticamente
4. Configurar Docker Socket Mount
5. Integrar Jenkins en Docker Compose
6. Verificar acceso en:

```text
http://localhost:9090
```

## Pipeline de verificación

```groovy
pipeline {
    agent any

    stages {
        stage('Verificación') {
            steps {
                echo '✅ Jenkins configurado'
                sh 'docker --version'
                sh 'docker ps'
            }
        }
    }
}
```

---

# Punto 2 – Jenkinsfile Build y Test

## Jenkinsfile ejemplo

```groovy
pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Código obtenido'
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean compile -DskipTests'
            }
        }

        stage('Test') {
            steps {
                sh 'mvn verify'
            }
        }
    }

    post {
        success {
            echo '✅ Build exitoso'
        }

        failure {
            echo '❌ Pipeline falló'
        }
    }
}
```

---

# Cobertura según lenguaje

| Lenguaje | Build | Test + Cobertura |
|---|---|---|
| Java Maven | `mvn clean compile -DskipTests` | `mvn verify` |
| Java Gradle | `gradle build -x test` | `gradle test jacocoTestReport` |
| Python | `pip install -r requirements.txt` | `pytest --cov --cov-report=xml` |
| Node.js | `npm install` | `nyc --reporter=lcov npm test` |
| Go | `go build ./...` | `go test -coverprofile=coverage.out ./...` |

---

# JCasC

```yaml
jobs:
  - script: |
      pipelineJob('empleados-service') {
        definition {
          cpsScm {
            scm {
              git {
                remote {
                  url('https://github.com/usuario/empleados-service.git')
                }
                branches('*/main')
              }
            }
            scriptPath('Jenkinsfile')
          }
        }
      }
```

---

# Punto 3 – SonarQube

## Docker Compose

```yaml
services:
  sonarqube:
    image: sonarqube:lts-community

    ports:
      - "9000:9000"

  sonar-db:
    image: postgres:16-alpine
```

---

# sonar-project.properties

```properties
sonar.projectKey=mi-microservicio
sonar.projectName=Mi Microservicio
sonar.sources=src
sonar.host.url=http://sonarqube:9000
```

---

# Jenkinsfile SonarQube

```groovy
stage('SonarQube') {
    steps {
        sh '''
        mvn sonar:sonar \
        -Dsonar.host.url=http://sonarqube:9000 \
        -Dsonar.token=${SONAR_TOKEN}
        '''
    }
}

stage('Quality Gate') {
    steps {
        timeout(time: 5, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
        }
    }
}
```

---

# Punto 4 – Docker Package y E2E

## Build imagen Docker

```groovy
stage('Package') {
    steps {
        script {
            def imageName = "mi-microservicio"
            def imageTag = "${env.BUILD_NUMBER}"

            sh "docker build -t ${imageName}:${imageTag} -t ${imageName}:latest ."
        }
    }
}
```

---

# Docker Registry

```yaml
services:
  registry:
    image: registry:2

    ports:
      - "5000:5000"
```

---

# E2E Tests

```groovy
stage('E2E Tests') {

    steps {

        sh 'docker-compose up -d --build'

        sh '''
        echo "Esperando servicios..."
        sleep 30
        '''

        sh '''
        cd e2e-tests
        mvn test
        '''
    }

    post {
        always {
            sh 'docker-compose down'
        }
    }
}
```

---

# Punto 5 – README y reproducibilidad

## Debe incluir

- Explicación CI
- URL Jenkins
- Cómo levantar el sistema
- Cómo ejecutar pipelines
- Capturas de Jenkins
- Interpretación de resultados

---

# Entregables

- docker-compose.yml actualizado
- Jenkinsfiles
- Dockerfile Jenkins
- README.md
- Código en GitHub

---

# Consideraciones

- Jenkins debe correr en Docker
- Jenkinsfiles versionados
- Variables sensibles en credentials
- Pipelines idempotentes

---

# Criterios de evaluación

| Punto | Tema | Valor |
|---|---|---|
| 1 | Jenkins | 1.0 |
| 2 | Build/Test | 1.0 |
| 3 | SonarQube | 1.0 |
| 4 | Docker/E2E | 1.0 |
| 5 | Documentación | 1.0 |

