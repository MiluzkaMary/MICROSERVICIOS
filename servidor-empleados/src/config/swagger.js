/**
 * Configuración de Swagger/OpenAPI para el servicio de Empleados
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Empleados - Microservicio',
      version: '1.0.0',
      description: `
Microservicio para la gestión de empleados.

**Características:**
- CRUD completo de empleados
- Validación de departamento mediante comunicación con servicio externo
- Paginación y filtrado avanzado
- Manejo robusto de errores
- Resiliencia con timeout y reintentos

**Comunicación entre servicios:**
- Este servicio valida la existencia de departamentos antes de crear un empleado
- Usa comunicación HTTP REST con el servicio de departamentos
- Implementa timeout (3s) y reintentos (2) para resiliencia
      `,
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'dev@empresa.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Servidor de desarrollo (local)'
      },
      {
        url: 'http://empleados-service:8080',
        description: 'Servidor interno (Docker)'
      }
    ],
    tags: [
      {
        name: 'Empleados',
        description: 'Operaciones CRUD para empleados'
      },
      {
        name: 'Health',
        description: 'Endpoints de monitoreo y salud del servicio'
      }
    ],
    components: {
      schemas: {
        Empleado: {
          type: 'object',
          required: ['id', 'nombre', 'email', 'departamentoId', 'fechaIngreso'],
          properties: {
            id: {
              type: 'string',
              description: 'Identificador único del empleado',
              example: 'EMP001'
            },
            nombre: {
              type: 'string',
              description: 'Nombre completo del empleado',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del empleado (único)',
              example: 'juan.perez@empresa.com'
            },
            departamentoId: {
              type: 'string',
              description: 'ID del departamento al que pertenece (debe existir en servicio de departamentos)',
              example: '1'
            },
            fechaIngreso: {
              type: 'string',
              format: 'date',
              description: 'Fecha de ingreso del empleado',
              example: '2024-01-15'
            }
          }
        },
        EmpleadoPaginado: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Empleado'
              }
            },
            page: {
              type: 'integer',
              description: 'Número de página actual',
              example: 1
            },
            size: {
              type: 'integer',
              description: 'Cantidad de registros por página',
              example: 10
            },
            totalRecords: {
              type: 'integer',
              description: 'Total de registros en la base de datos',
              example: 50
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas disponibles',
              example: 5
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Nombre del error HTTP',
              example: 'Bad Request'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo del error',
              example: 'Datos inválidos'
            },
            status: {
              type: 'integer',
              description: 'Código de estado HTTP',
              example: 400
            },
            path: {
              type: 'string',
              description: 'Ruta del endpoint que generó el error',
              example: '/empleados'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp del error',
              example: '2026-02-23T12:34:56.000Z'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Lista de errores de validación (opcional)',
              example: ['nombre es requerido', 'email inválido']
            }
          }
        },
        Health: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK'
            },
            service: {
              type: 'string',
              example: 'servidor-empleados'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Petición inválida - datos incorrectos o faltantes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Conflict: {
          description: 'Conflicto - recurso ya existe',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServiceUnavailable: {
          description: 'Servicio no disponible - timeout o servicio externo caído',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
