const express = require("express");

const app = express();
app.use(express.json());

// Guardamos empleados en memoria (Map por id)
const empleadosPorId = new Map();
// Para validar duplicados por email
const idPorEmail = new Map();

function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

function emailBasicoValido(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

// POST http://localhost/empleados
app.post("/empleados", (req, res) => {
  const body = req.body || {};

  const empleado = {
    id: body.id !== undefined ? String(body.id).trim() : "",
    nombre: (body.nombre || "").trim(),
    apellido: (body.apellido || "").trim(),
    email: (body.email || "").trim().toLowerCase(),
    numeroEmpleado: body.numeroEmpleado !== undefined ? String(body.numeroEmpleado).trim() : "",
    cargo: (body.cargo || "").trim(),
    area: (body.area || "").trim(),
    estado: (body.estado || "ACTIVO").trim()
  };

  // Validaciones basicas (nulls o vacios)
  const errores = [];
  if (isBlank(empleado.id)) errores.push("id es requerido");
  if (isBlank(empleado.nombre)) errores.push("nombre es requerido");
  if (isBlank(empleado.apellido)) errores.push("apellido es requerido");
  if (isBlank(empleado.email)) errores.push("email es requerido");
  if (!isBlank(empleado.email) && !emailBasicoValido(empleado.email)) errores.push("email inválido");
  if (isBlank(empleado.numeroEmpleado)) errores.push("numeroEmpleado es requerido");
  if (isBlank(empleado.cargo)) errores.push("cargo es requerido");
  if (isBlank(empleado.area)) errores.push("area es requerido");

  if (errores.length > 0) {
    return res.status(400).json({ message: "Datos inválidos", errors: errores });
  }

  // Duplicados: NO se permite registrar si ya existe id o email
  if (empleadosPorId.has(empleado.id)) {
    return res.status(409).json({ message: `Ya existe un empleado con id ${empleado.id}` });
  }
  if (idPorEmail.has(empleado.email)) {
    return res.status(409).json({ message: `Ya existe un empleado con email ${empleado.email}` });
  }

  empleadosPorId.set(empleado.id, empleado);
  idPorEmail.set(empleado.email, empleado.id);

  // Respuesta ok
  return res.status(200).json(empleado);
});

// GET http://localhost/empleados/{id}
app.get("/empleados/:id", (req, res) => {
  const id = String(req.params.id);
  const empleado = empleadosPorId.get(id);

  if (!empleado) {
    // Mensaje error
    return res.status(404).send(`El empleado con id ${id} no existe`);
  }

  return res.status(200).json(empleado);
});

// Cualquier otro: 404 
app.use((req, res) => {
  res.status(404).send("Recurso no encontrado");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
