const Validador = require("../Herramientas/Validador.js");

class Informacion {
  constructor(db) {
    this.db = db;
    this.tabla = "informacion";

    // Esquema de validación para entrada (id_informacion es autoincremental)
    this.validacionEsquema = {
      fk_proyecto: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      tipo_informacion: {
        tipo: "string",
        obligatorio: true,
        enum: ["objetivo_general", "objetivo_especifico", "misicion", "vision"],
      },
      nombre_informacion: {
        tipo: "string",
        obligatorio: true,
        maxLength: 800,
      },
      estado_informacion: {
        tipo: "string",
        obligatorio: false,
        enum: ["en espera", "en progreso", "completo"],
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_informacion",
      "fk_proyecto",
      "tipo_informacion",
      "nombre_informacion",
      "estado_informacion",
    ];
    this.camposAEscape = ["nombre_informacion"];
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
        mensaje: resultado.mensaje || "Error al crear la información",
      };
    }
    return { evento: true, id_informacion: resultado.id_informacion };
  }

  async eliminar(id_informacion) {
    const validacionId = Validador.validarId(id_informacion, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_informacion: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlEliminar(id_informacion);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar la información",
      };
    }
    return { evento: true };
  }

  async actualizar(id_informacion, campos) {
    const validacionId = Validador.validarId(id_informacion, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_informacion: validacionId.mensaje },
      };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_informacion, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar la información",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar la información",
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
        mensaje: resultado.mensaje || "Error al consultar información activa",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarPorId(id_informacion) {
    const validacionId = Validador.validarId(id_informacion, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_informacion: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlConsultarPorId(id_informacion);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje || "Error al consultar la información por ID",
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
        mensaje: resultado.mensaje || "Error al buscar información",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const {
      fk_proyecto,
      tipo_informacion,
      nombre_informacion,
      estado_informacion,
    } = datos;
    const sql = `INSERT INTO ${this.tabla} 
      (fk_proyecto, tipo_informacion, nombre_informacion, estado_informacion) 
      VALUES (?, ?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        fk_proyecto,
        tipo_informacion,
        nombre_informacion,
        estado_informacion || "en espera",
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_informacion: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return {
          evento: false,
          mensaje: { fk_proyecto: "El proyecto referenciado no existe" },
        };
      }
      console.error("Error en sqlCrear (informacion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_informacion) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_informacion = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_informacion]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Información no encontrada" };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (informacion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_informacion, campos) {
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
    valores.push(id_informacion);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_informacion = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Información no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (informacion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (informacion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarActivos() {
    // Según el SQL original, los estados activos podrían ser 'en espera' y 'en progreso'
    const sql = `SELECT * FROM ${this.tabla} WHERE estado_informacion IN ('en espera', 'en progreso')`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarActivos (informacion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_informacion) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_informacion = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_informacion]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (informacion):", error);
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
      console.error("Error en sqlBuscarPorAtributos (informacion):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Informacion;
