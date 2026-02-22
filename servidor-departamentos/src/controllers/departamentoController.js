const departamentoService = require('../services/departamentoService');

exports.crearDepartamento = async (req, res) => {
  try {
    const departamento = await departamentoService.crearDepartamento(req.body);
    res.status(201).json(departamento);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

exports.listarDepartamentos = async (req, res) => {
  try {
    const departamentos = await departamentoService.listarDepartamentos();
    res.status(200).json(departamentos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

exports.obtenerDepartamentoPorId = async (req, res) => {
  try {
    const departamento = await departamentoService.obtenerDepartamentoPorId(req.params.id);
    if (!departamento) {
      return res.status(404).json({ mensaje: 'Departamento no encontrado' });
    }
    res.status(200).json(departamento);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};
