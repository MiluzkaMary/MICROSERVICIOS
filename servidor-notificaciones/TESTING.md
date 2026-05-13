# Pruebas Unitarias - servidor-notificaciones

## 📋 Resumen

El microservicio `servidor-notificaciones` cuenta con **3 clases de prueba unitaria** que cubren los componentes principales del sistema:

| Test | Ubicación | Descripción |
|------|-----------|-------------|
| `NotificacionControllerTest` | `src/test/java/.../controller/` | Pruebas de endpoints REST y seguridad JWT |
| `NotificacionServiceTest` | `src/test/java/.../service/` | Pruebas de lógica de negocio |
| `NotificacionEventConsumerTest` | `src/test/java/.../messaging/` | Pruebas de consumo de eventos RabbitMQ |

---

## 🧪 Detalles de las Pruebas

### 1. NotificacionControllerTest

**Propósito:** Validar que los endpoints REST funcionan correctamente con seguridad JWT.

**Casos cubiertos:**
- ✅ `/health` debe ser público (sin token)
- ✅ `/api-docs.json` debe ser público (sin token)
- ✅ `/notificaciones` debe rechazar sin token (401 Unauthorized)
- ✅ `/notificaciones` debe rechazar usuarios normales (403 Forbidden)
- ✅ `/notificaciones` debe permitir admins (200 OK)

**Framework:** MockMvc + JUnit 5 + Mockito

**Comando de ejecución:**
```bash
mvn test -Dtest=NotificacionControllerTest
```

---

### 2. NotificacionServiceTest

**Propósito:** Validar la lógica de negocio del servicio.

**Casos cubiertos:**
- ✅ `procesarEmpleadoCreado`: Crea notificación de bienvenida, envía email y marca como enviada
- ✅ `obtenerEstadisticas`: Mapea correctamente las estadísticas desde la BD

**Framework:** JUnit 5 + Mockito

**Comando de ejecución:**
```bash
mvn test -Dtest=NotificacionServiceTest
```

---

### 3. NotificacionEventConsumerTest

**Propósito:** Validar que el consumidor de eventos RabbitMQ procesa mensajes correctamente.

**Casos cubiertos:**
- ✅ Consume evento `empleado.creado` y llama al servicio
- ✅ Consume evento `usuario.recuperacion` y llama al servicio

**Framework:** JUnit 5 + Mockito

**Comando de ejecución:**
```bash
mvn test -Dtest=NotificacionEventConsumerTest
```

---

## 🚀 Ejecución de Pruebas

### Localmente

```bash
cd servidor-notificaciones

# Ejecutar todas las pruebas
mvn clean test

# Ejecutar una prueba específica
mvn test -Dtest=NotificacionControllerTest

# Ejecutar con detalle verboso
mvn test -X
```

### Con Reporte de Cobertura (JaCoCo)

```bash
mvn clean test jacoco:report
# Reporte generado en: target/site/jacoco/index.html
```

### Con Maven Wrapper (si está disponible)

```bash
./mvnw clean test
```

---

## 📊 Configuración Maven

El `pom.xml` está configurado con:

```xml
<!-- Maven Surefire: Ejecuta pruebas unitarias -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.1.2</version>
</plugin>

<!-- JaCoCo: Genera reportes de cobertura -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <!-- Mínimo de cobertura requerida: 30% -->
</plugin>
```

---

## 🔗 Integración con Jenkins

### Pipeline Configuration

El archivo `Jenkinsfile` en la raíz del proyecto ejecuta automáticamente:

1. **Verificación de herramientas** (Java, Maven, Docker)
2. **Checkout del repositorio**
3. **Ejecución de pruebas unitarias**
4. **Generación de reportes JaCoCo**
5. **Publicación de resultados en Jenkins**
6. **Construcción de imagen Docker**
7. **Análisis opcional con SonarQube**

### Configurar Jenkins Job

1. En Jenkins, crea un job tipo **Pipeline**
2. En **Pipeline script from SCM**:
   - SCM: `Git`
   - Repository URL: `<tu-repo-url>`
   - Branch: `main` (o tu rama)
   - Script Path: `Jenkinsfile`

3. Habilita **Poll SCM** si quieres builds automáticos

### Ver Resultados en Jenkins

- **Test Results:** Dashboard → Build → Test Results
- **Coverage Report:** Dashboard → Build → JaCoCo Coverage Report

---

## 📦 Dependencias de Test

```xml
<!-- Spring Boot Test Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- H2 Database (BD en memoria para tests) -->
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

---

## ⚙️ Mocks y Configuración de Test

### Propiedades de Test

```properties
# application-test.yml
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect
```

### Mocks Configurados

- `NotificacionService`: Mockeado en tests de controller
- `NotificacionRepository`: Mockeado en tests de service
- `EmailService`: Mockeado para no enviar emails reales
- `JWT Secret`: Configurado como `test-secret-key-para-pruebas-unitarias-32b`

---

## 🎯 Próximos Pasos

1. **Aumentar cobertura:** Agregar más casos de prueba para lograr >70%
2. **Tests de integración:** Agregar `@SpringBootTest` para tests end-to-end
3. **Mocking de RabbitMQ:** Usar `@RabbitListener` con testcontainers
4. **Performance tests:** Agregar pruebas de carga con JMeter/Gatling
5. **E2E en Cucumber:** Integrar con e2e-tests/

---

## 📝 Troubleshooting

### "Tests are failing locally but passing in Jenkins"

- Verifica que el Java version sea 18+ local
- Asegúrate de que spring.datasource está configurado para H2

### "JaCoCo coverage report not generated"

- Ejecuta: `mvn clean test jacoco:report`
- Revisa el directorio: `target/site/jacoco/`

### "Cannot connect to RabbitMQ in EventConsumerTest"

- Es normal; el test usa Mockito sin RabbitMQ real
- Si necesitas RabbitMQ real, usa **@RabbitListenerTest** o **testcontainers**

---

## 📚 Referencias

- [Spring Boot Testing Documentation](https://spring.io/guides/gs/testing-web/)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [JaCoCo Maven Plugin](https://www.jacoco.org/jacoco/trunk/doc/maven.html)

---

**Última actualización:** May 13, 2026  
**Versión:** 1.0.0
