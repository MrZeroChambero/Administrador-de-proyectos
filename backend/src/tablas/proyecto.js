const Validador = require("../Herramientas/Validador.js");

class Proyecto {
  constructor(db) {
    this.db = db;
    this.tabla = "proyecto";

    // Esquema de validación para entrada (id_proyecto es string, no autoincremental)
    this.validacionEsquema = {
      id_proyecto: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      nombre: {
        tipo: "string",
        obligatorio: true,
        maxLength: 255,
      },
      descripcion: {
        tipo: "string",
        obligatorio: true,
        maxLength: 2000,
      },
      estado_proyecto: {
        tipo: "string",
        obligatorio: false,
        enum: [
          "en espera",
          "en progreso",
          "pausado",
          "finalizado",
          "cancelado",
        ],
      },
      progreso: {
        tipo: "number",
        obligatorio: true,
        min: 0,
        max: 100,
      },
      icono_proyecto: {
        tipo: "string",
        obligatorio: false,
        maxLength: 2000,
      },
      fecha_inicio: {
        tipo: "string",
        obligatorio: true,
        fecha: true,
      },
      fecha_fin: {
        tipo: "string",
        obligatorio: true,
        fecha: true,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_proyecto",
      "nombre",
      "descripcion",
      "estado_proyecto",
      "progreso",
      "icono_proyecto",
      "fecha_inicio",
      "fecha_fin",
    ];
    this.camposAEscape = ["nombre", "descripcion", "icono_proyecto"];
  }

  // Método de validación reutilizable
  validarDatos(datos, esActualizacion = false) {
    let esquema = { ...this.validacionEsquema };
    if (esActualizacion) {
      for (let clave in esquema) {
        esquema[clave] = { ...esquema[clave], obligatorio: false };
      }
      delete esquema.id_proyecto; // No se debe actualizar la clave primaria
    }
    const resultadoValidacion = Validador.validar(datos, esquema);
    if (resultadoValidacion.evento) {
      return { valido: true, errores: null };
    } else {
      return { valido: false, errores: resultadoValidacion.mensaje };
    }
  }

  // Sanitizar salida (filtra campos y escapa HTML)
  sanitizarSalida(datos) {
    return Validador.sanitizarSalida(
      datos,
      this.camposPermitidosSalida,
      this.camposAEscape
    );
  }

  // --- Métodos públicos ---

  async crear(datos) {
    const validacion = this.validarDatos(datos, false);
    if (!validacion.valido) {
      return { evento: false, mensaje: validacion.errores };
    }
    const resultado = await this.sqlCrear(datos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al crear el proyecto",
      };
    }
    return { evento: true, id_proyecto: resultado.id_proyecto };
  }

  async eliminar(id_proyecto) {
    const validacionId = Validador.validarId(id_proyecto, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_proyecto: validacionId.mensaje } };
    }
    const resultado = await this.sqlEliminar(id_proyecto);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar el proyecto",
      };
    }
    return { evento: true };
  }

  async actualizar(id_proyecto, campos) {
    const validacionId = Validador.validarId(id_proyecto, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_proyecto: validacionId.mensaje } };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_proyecto, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar el proyecto",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar los proyectos",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    const resultado = await this.sqlConsultarActivos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar proyectos activos",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarPorId(id_proyecto) {
    const validacionId = Validador.validarId(id_proyecto, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_proyecto: validacionId.mensaje } };
    }
    const resultado = await this.sqlConsultarPorId(id_proyecto);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar el proyecto por ID",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async buscarPorAtributos(atributos) {
    const validacion = this.validarDatos(atributos, true);
    if (!validacion.valido) {
      return { evento: false, mensaje: validacion.errores };
    }
    const resultado = await this.sqlBuscarPorAtributos(atributos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al buscar proyectos",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const {
      id_proyecto,
      nombre,
      descripcion,
      estado_proyecto,
      progreso,
      icono_proyecto,
      fecha_inicio,
      fecha_fin,
    } = datos;
    const sql = `INSERT INTO ${this.tabla} 
      (id_proyecto, nombre, descripcion, estado_proyecto, progreso, icono_proyecto, fecha_inicio, fecha_fin) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        id_proyecto,
        nombre,
        descripcion,
        estado_proyecto || "en espera",
        progreso,
        icono_proyecto || null,
        fecha_inicio,
        fecha_fin,
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_proyecto };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return {
          evento: false,
          mensaje: { id_proyecto: "El ID del proyecto ya existe" },
        };
      }
      console.error("Error en sqlCrear (proyecto):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_proyecto) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_proyecto = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_proyecto]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Proyecto no encontrado" };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (proyecto):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_proyecto, campos) {
    const camposPermitidos = Object.keys(this.validacionEsquema).filter(
      (clave) => clave !== "id_proyecto"
    );
    const actualizaciones = [];
    const valores = [];
    for (const [clave, valor] of Object.entries(campos)) {
      if (camposPermitidos.includes(clave) && valor !== undefined) {
        actualizaciones.push(`${clave} = ?`);
        valores.push(valor);
      }
    }
    if (actualizaciones.length === 0) {
      return {
        evento: false,
        mensaje: "No hay campos válidos para actualizar",
      };
    }
    valores.push(id_proyecto);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_proyecto = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Proyecto no encontrado o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (proyecto):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (proyecto):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarActivos() {
    // Según lógica original: estados 'en espera' o 'en progreso'
    const sql = `SELECT * FROM ${this.tabla} WHERE estado_proyecto IN ('en espera', 'en progreso')`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarActivos (proyecto):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_proyecto) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_proyecto = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_proyecto]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (proyecto):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlBuscarPorAtributos(atributos) {
    const condiciones = [];
    const valores = [];
    for (const [clave, valor] of Object.entries(atributos)) {
      if (this.validacionEsquema[clave] && clave !== "id_proyecto") {
        condiciones.push(`${clave} = ?`);
        valores.push(valor);
      }
    }
    if (condiciones.length === 0) {
      return { evento: true, datos: [] };
    }
    const sql = `SELECT * FROM ${this.tabla} WHERE ${condiciones.join(
      " AND "
    )}`;
    try {
      const [filas] = await this.db.query(sql, valores);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlBuscarPorAtributos (proyecto):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Proyecto;
