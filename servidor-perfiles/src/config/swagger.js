/**
 * Configuración de Swagger/OpenAPI para documentación de API
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestión de Perfiles de Empleados',
      version: '1.0.0',
      description: 'Microservicio para gestionar perfiles de empleados. Permite consultar, crear y actualizar información de perfil como teléfono, dirección y biografía.',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'dev@empresa.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8082',
        description: 'Servidor de desarrollo'
      }
    ],
    tags: [
      {
        name: 'Perfiles',
        description: 'Operaciones relacionadas con perfiles de empleados'
      },
      {
        name: 'Health',
        description: 'Endpoints de salud del servicio'
      }
    ],
    components: {
      schemas: {
        Perfil: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del perfil (generado automáticamente)',
              example: 1
            },
            empleadoId: {
              type: 'string',
              description: 'ID del empleado asociado al perfil',
              example: 'E001'
            },
            nombre: {
              type: 'string',
              description: 'Nombre completo del empleado',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del empleado',
              example: 'juan.perez@empresa.com'
            },
            telefono: {
              type: 'string',
              description: 'Número de teléfono',
              example: '+57 300 123 4567'
            },
            direccion: {
              type: 'string',
              description: 'Dirección de residencia',
              example: 'Calle 123 #45-67'
            },
            ciudad: {
              type: 'string',
              description: 'Ciudad de residencia',
              example: 'Bogotá'
            },
            biografia: {
              type: 'string',
              description: 'Biografía o descripción del empleado',
              example: 'Desarrollador Full Stack con 5 años de experiencia'
            },
            fechaCreacion: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de creación del perfil',
              example: '2024-01-15T10:30:00Z'
            },
            fechaActualizacion: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de última actualización',
              example: '2024-01-20T14:45:00Z'
            }
          }
        },
        PerfilInput: {
          type: 'object',
          properties: {
            telefono: {
              type: 'string',
              description: 'Número de teléfono',
              example: '+57 300 123 4567'
            },
            direccion: {
              type: 'string',
              description: 'Dirección de residencia',
              example: 'Calle 123 #45-67'
            },
            ciudad: {
              type: 'string',
              description: 'Ciudad de residencia',
              example: 'Bogotá'
            },
            biografia: {
              type: 'string',
              description: 'Biografía o descripción del empleado',
              example: 'Desarrollador Full Stack con 5 años de experiencia'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            statusCode: {
              type: 'integer',
              example: 404
            },
            message: {
              type: 'string',
              example: 'Perfil no encontrado'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['El perfil con empleadoId E999 no existe']
            }
          }
        },
        Health: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'UP'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            service: {
              type: 'string',
              example: 'perfiles-service'
            },
            version: {
              type: 'string',
              example: '1.0.0'
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
