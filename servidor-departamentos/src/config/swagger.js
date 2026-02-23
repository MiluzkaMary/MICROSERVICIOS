/**
 * Configuración de Swagger/OpenAPI para el servicio de Departamentos
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Departamentos - Microservicio',
      version: '1.0.0',
      description: `
Microservicio para la gestión de departamentos.

**Características:**
- CRUD completo de departamentos
- Paginación y filtrado
- Validación de datos
- Prevención de duplicados
- Manejo robusto de errores

**Arquitectura:**
- Base de datos independiente (PostgreSQL)
- Comunicación REST con otros servicios
- Contenedorizado con Docker
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
        url: 'http://localhost:8081',
        description: 'Servidor de desarrollo (local)'
      },
      {
        url: 'http://departamentos-service:8081',
        description: 'Servidor interno (Docker)'
      }
    ],
    tags: [
      {
        name: 'Departamentos',
        description: 'Operaciones CRUD para departamentos'
      },
      {
        name: 'Health',
        description: 'Endpoints de monitoreo y salud del servicio'
      }
    ],
    components: {
      schemas: {
        Departamento: {
          type: 'object',
          required: ['nombre'],
          properties: {
            id: {
              type: 'integer',
              description: 'Identificador único del departamento (autogenerado)',
              readOnly: true,
              example: 1
            },
            nombre: {
              type: 'string',
              description: 'Nombre del departamento (único)',
              example: 'Tecnología'
            },
            descripcion: {
              type: 'string',
              description: 'Descripción del departamento (opcional)',
              example: 'Departamento de desarrollo de software e infraestructura'
            }
          }
        },
        DepartamentoInput: {
          type: 'object',
          required: ['nombre'],
          properties: {
            nombre: {
              type: 'string',
              description: 'Nombre del departamento',
              example: 'Tecnología'
            },
            descripcion: {
              type: 'string',
              description: 'Descripción del departamento (opcional)',
              example: 'Departamento de desarrollo de software'
            }
          }
        },
        DepartamentoPaginado: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Departamento'
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
              example: 25
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas disponibles',
              example: 3
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
              example: '/departamentos'
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
              example: ['nombre es requerido']
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
              example: 'servidor-departamentos'
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
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
