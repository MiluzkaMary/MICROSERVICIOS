const departamentoRepository = require('../repositories/departamentoRepository');

exports.crearDepartamento = async (data) => {
  if (!data.nombre) throw new Error('El nombre es obligatorio');
  return departamentoRepository.crearDepartamento(data);
};

exports.listarDepartamentos = async () => {
  return departamentoRepository.listarDepartamentos();
};

exports.obtenerDepartamentoPorId = async (id) => {
  return departamentoRepository.obtenerDepartamentoPorId(id);
};
