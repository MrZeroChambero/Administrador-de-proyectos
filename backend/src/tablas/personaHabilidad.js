const Validador = require("../Herramientas/Validador.js");

class PersonaHabilidad {
  constructor(db) {
    this.db = db;
    this.tabla = "persona_habilidad";

    // Esquema de validación para entrada (id_persona_habilidad es autoincremental)
    this.validacionEsquema = {
      fk_persona: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      fk_habilidad: {
        tipo: "number",
        obligatorio: true,
        min: 1,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_persona_habilidad",
      "fk_persona",
      "fk_habilidad",
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
          resultado.mensaje || "Error al crear la relación persona-habilidad",
      };
    }
    return {
      evento: true,
      id_persona_habilidad: resultado.id_persona_habilidad,
    };
  }

  async eliminar(id_persona_habilidad) {
    const validacionId = Validador.validarId(id_persona_habilidad, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_persona_habilidad: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlEliminar(id_persona_habilidad);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al eliminar la relación persona-habilidad",
      };
    }
    return { evento: true };
  }

  async actualizar(id_persona_habilidad, campos) {
    const validacionId = Validador.validarId(id_persona_habilidad, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_persona_habilidad: validacionId.mensaje },
      };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_persona_habilidad, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al actualizar la relación persona-habilidad",
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
          "Error al consultar las relaciones persona-habilidad",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    // La tabla no tiene campo estado, retorna todos
    return this.consultarTodos();
  }

  async consultarPorId(id_persona_habilidad) {
    const validacionId = Validador.validarId(id_persona_habilidad, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_persona_habilidad: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlConsultarPorId(id_persona_habilidad);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al consultar la relación persona-habilidad por ID",
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
          resultado.mensaje || "Error al buscar relaciones persona-habilidad",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { fk_persona, fk_habilidad } = datos;
    const sql = `INSERT INTO ${this.tabla} (fk_persona, fk_habilidad) VALUES (?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [fk_persona, fk_habilidad]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_persona_habilidad: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        // Determinar qué FK falló
        if (error.message.includes("fk_persona")) {
          return {
            evento: false,
            mensaje: { fk_persona: "La persona referenciada no existe" },
          };
        }
        if (error.message.includes("fk_habilidad")) {
          return {
            evento: false,
            mensaje: { fk_habilidad: "La habilidad referenciada no existe" },
          };
        }
        return { evento: false, mensaje: "Violación de clave foránea" };
      }
      console.error("Error en sqlCrear (personaHabilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_persona_habilidad) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_persona_habilidad = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_persona_habilidad]);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Relación persona-habilidad no encontrada",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (personaHabilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_persona_habilidad, campos) {
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
    valores.push(id_persona_habilidad);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_persona_habilidad = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje:
            "Relación persona-habilidad no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (personaHabilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (personaHabilidad):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_persona_habilidad) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_persona_habilidad = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_persona_habilidad]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (personaHabilidad):", error);
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
      console.error(
        "Error en sqlBuscarPorAtributos (personaHabilidad):",
        error
      );
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = PersonaHabilidad;
