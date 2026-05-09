const Validador = require("../Herramientas/Validador.js");

class ObjetivoMeta {
  constructor(db) {
    this.db = db;
    this.tabla = "objetivo_meta";

    // Esquema de validación para entrada (id_objetivo_meta es autoincremental)
    this.validacionEsquema = {
      fk_objetivo: {
        tipo: "number",
        obligatorio: true,
        min: 1,
      },
      fk_meta: {
        tipo: "number",
        obligatorio: true,
        min: 1,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_objetivo_meta",
      "fk_objetivo",
      "fk_meta",
    ];
    this.camposAEscape = []; // No hay campos que puedan contener HTML
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
        mensaje:
          resultado.mensaje || "Error al crear la relación objetivo-meta",
      };
    }
    return { evento: true, id_objetivo_meta: resultado.id_objetivo_meta };
  }

  async eliminar(id_objetivo_meta) {
    const validacionId = Validador.validarId(id_objetivo_meta, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_objetivo_meta: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlEliminar(id_objetivo_meta);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje || "Error al eliminar la relación objetivo-meta",
      };
    }
    return { evento: true };
  }

  async actualizar(id_objetivo_meta, campos) {
    const validacionId = Validador.validarId(id_objetivo_meta, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_objetivo_meta: validacionId.mensaje },
      };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_objetivo_meta, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje || "Error al actualizar la relación objetivo-meta",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al consultar las relaciones objetivo-meta",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    // La tabla no tiene campo estado, retorna todos
    return this.consultarTodos();
  }

  async consultarPorId(id_objetivo_meta) {
    const validacionId = Validador.validarId(id_objetivo_meta, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_objetivo_meta: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlConsultarPorId(id_objetivo_meta);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al consultar la relación objetivo-meta por ID",
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
        mensaje:
          resultado.mensaje || "Error al buscar relaciones objetivo-meta",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { fk_objetivo, fk_meta } = datos;
    const sql = `INSERT INTO ${this.tabla} (fk_objetivo, fk_meta) VALUES (?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [fk_objetivo, fk_meta]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_objetivo_meta: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        // Determinar qué FK falló
        if (error.message.includes("fk_objetivo")) {
          return {
            evento: false,
            mensaje: { fk_objetivo: "El objetivo referenciado no existe" },
          };
        }
        if (error.message.includes("fk_meta")) {
          return {
            evento: false,
            mensaje: { fk_meta: "La meta referenciada no existe" },
          };
        }
        return { evento: false, mensaje: "Violación de clave foránea" };
      }
      console.error("Error en sqlCrear (objetivoMeta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_objetivo_meta) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_objetivo_meta = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_objetivo_meta]);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Relación objetivo-meta no encontrada",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (objetivoMeta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_objetivo_meta, campos) {
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
    valores.push(id_objetivo_meta);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_objetivo_meta = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje:
            "Relación objetivo-meta no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (objetivoMeta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (objetivoMeta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_objetivo_meta) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_objetivo_meta = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_objetivo_meta]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (objetivoMeta):", error);
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
      console.error("Error en sqlBuscarPorAtributos (objetivoMeta):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = ObjetivoMeta;
