/**
 * Configuración de Swagger/OpenAPI para documentación de API
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Notificaciones',
      version: '1.0.0',
      description: 'Microservicio para gestionar notificaciones enviadas a empleados. Mantiene un historial de notificaciones de bienvenida y desvinculación.',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'dev@empresa.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8083',
        description: 'Servidor de desarrollo'
      }
    ],
    tags: [
      {
        name: 'Notificaciones',
        description: 'Operaciones relacionadas con notificaciones'
      },
      {
        name: 'Eventos',
        description: 'Endpoints para recibir eventos de otros servicios'
      },
      {
        name: 'Health',
        description: 'Endpoints de salud del servicio'
      }
    ],
    components: {
      schemas: {
        Notificacion: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la notificación (generado automáticamente)',
              example: 1
            },
            tipo: {
              type: 'string',
              enum: ['BIENVENIDA', 'DESVINCULACION'],
              description: 'Tipo de notificación',
              example: 'BIENVENIDA'
            },
            destinatario: {
              type: 'string',
              format: 'email',
              description: 'Email del destinatario',
              example: 'juan.perez@empresa.com'
            },
            mensaje: {
              type: 'string',
              description: 'Contenido del mensaje enviado',
              example: '¡Bienvenido a la empresa Juan Pérez! Estamos emocionados de tenerte en el equipo.'
            },
            fechaEnvio: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de envío de la notificación',
              example: '2024-01-15T10:30:00Z'
            },
            empleadoId: {
              type: 'string',
              description: 'ID del empleado relacionado',
              example: 'E001'
            },
            estado: {
              type: 'string',
              enum: ['ENVIADA', 'FALLIDA', 'PENDIENTE'],
              description: 'Estado del envío',
              example: 'ENVIADA'
            }
          }
        },
        EventoEmpleadoCreado: {
          type: 'object',
          required: ['empleadoId', 'nombre', 'email'],
          properties: {
            empleadoId: {
              type: 'string',
              example: 'E001'
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan.perez@empresa.com'
            }
          }
        },
        EventoEmpleadoDesvinculado: {
          type: 'object',
          required: ['empleadoId', 'nombre', 'email'],
          properties: {
            empleadoId: {
              type: 'string',
              example: 'E001'
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan.perez@empresa.com'
            },
            motivo: {
              type: 'string',
              example: 'Renuncia voluntaria'
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
              example: 400
            },
            message: {
              type: 'string',
              example: 'Error en la petición'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Campo requerido faltante']
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
              example: 'notificaciones-service'
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
