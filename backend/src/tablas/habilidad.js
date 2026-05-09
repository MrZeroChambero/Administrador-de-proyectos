const Validador = require("../Herramientas/Validador.js");

class Habilidad {
  constructor(db) {
    this.db = db;
    this.tabla = "habilidades";

    // Esquema de validación para entrada (id_habilidad es autoincremental)
    this.validacionEsquema = {
      nombre_habilidad: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 2000,
      },
      descripcion_habilidad: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 2000,
      },
      estado_habilidad: {
        tipo: "string",
        obligatorio: false,
        enum: ["activo", "inactivo"],
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_habilidad",
      "nombre_habilidad",
      "descripcion_habilidad",
      "estado_habilidad",
    ];
    this.camposAEscape = ["nombre_habilidad", "descripcion_habilidad"];
  }

  // Método de validación reutilizable
  validarDatos(datos, esActualizacion = false) {
    let esquema = { ...this.validacionEsquema };
    if (esActualizacion) {
      for (let clave in esquema) {
        esquema[clave] = { ...esquema[clave], obligatorio: false };
      }
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
        mensaje: resultado.mensaje || "Error al crear la habilidad",
      };
    }
    return { evento: true, id_habilidad: resultado.id_habilidad };
  }

  async eliminar(id_habilidad) {
    const validacionId = Validador.validarId(id_habilidad, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_habilidad: validacionId.mensaje } };
    }
    const resultado = await this.sqlEliminar(id_habilidad);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar la habilidad",
      };
    }
    return { evento: true };
  }

  async actualizar(id_habilidad, campos) {
    const validacionId = Validador.validarId(id_habilidad, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_habilidad: validacionId.mensaje } };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_habilidad, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar la habilidad",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar las habilidades",
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
        mensaje:
          resultado.mensaje || "Error al consultar las habilidades activas",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarPorId(id_habilidad) {
    const validacionId = Validador.validarId(id_habilidad, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_habilidad: validacionId.mensaje } };
    }
    const resultado = await this.sqlConsultarPorId(id_habilidad);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar la habilidad por ID",
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
        mensaje: resultado.mensaje || "Error al buscar habilidades",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { nombre_habilidad, descripcion_habilidad, estado_habilidad } = datos;
    const sql = `INSERT INTO ${this.tabla} 
      (nombre_habilidad, descripcion_habilidad, estado_habilidad) 
      VALUES (?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        nombre_habilidad,
        descripcion_habilidad,
        estado_habilidad || "activo",
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_habilidad: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return {
          evento: false,
          mensaje: { nombre_habilidad: "El nombre de la habilidad ya existe" },
        };
      }
      console.error("Error en sqlCrear (habilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_habilidad) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_habilidad = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_habilidad]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Habilidad no encontrada" };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (habilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_habilidad, campos) {
    const camposPermitidos = Object.keys(this.validacionEsquema);
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
    valores.push(id_habilidad);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_habilidad = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Habilidad no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (habilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (habilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarActivos() {
    const sql = `SELECT * FROM ${this.tabla} WHERE estado_habilidad = 'activo'`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarActivos (habilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_habilidad) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_habilidad = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_habilidad]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (habilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlBuscarPorAtributos(atributos) {
    const condiciones = [];
    const valores = [];
    for (const [clave, valor] of Object.entries(atributos)) {
      if (this.validacionEsquema[clave]) {
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
      console.error("Error en sqlBuscarPorAtributos (habilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Habilidad;
