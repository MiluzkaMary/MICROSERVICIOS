/**
 * Configuración de Swagger/OpenAPI
 */
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Autenticación - Microservicio Auth',
      version: '1.0.0',
      description: 'API REST para autenticación con JWT, recuperación de contraseñas y gestión de usuarios.',
      contact: {
        name: 'Equipo de Desarrollo'
      }
    },
    servers: [
      {
        url: 'http://localhost:8084',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /auth/login'
        }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@empresa.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'admin123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            usuario: {
              type: 'object',
              properties: {
                empleadoId: { type: 'string', example: 'EMP001' },
                email: { type: 'string', example: 'juan@empresa.com' },
                role: { type: 'string', example: 'USER' }
              }
            }
          }
        },
        RecoverPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@empresa.com'
            }
          }
        },
        RecoverPasswordResponse: {
          type: 'object',
          properties: {
            mensaje: {
              type: 'string',
              example: 'Token de recuperación enviado'
            },
            empleadoId: {
              type: 'string',
              example: 'EMP001'
            },
            email: {
              type: 'string',
              example: 'juan@empresa.com'
            }
          }
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'nuevaPassword'],
          properties: {
            token: {
              type: 'string',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
            },
            nuevaPassword: {
              type: 'string',
              format: 'password',
              example: 'NuevaPassword123!'
            }
          }
        },
        ResetPasswordResponse: {
          type: 'object',
          properties: {
            mensaje: {
              type: 'string',
              example: 'Contraseña establecida correctamente'
            },
            empleadoId: {
              type: 'string',
              example: 'EMP001'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Descripción del error'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
