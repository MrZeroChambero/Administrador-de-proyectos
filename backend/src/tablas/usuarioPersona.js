const Validador = require("../Herramientas/Validador.js");

class UsuarioPersona {
  constructor(db) {
    this.db = db;
    this.tabla = "usuario_persona";

    // Esquema de validación para entrada (id_usuario_persona es autoincremental)
    this.validacionEsquema = {
      fk_persona: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      fk_usuario: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_usuario_persona",
      "fk_persona",
      "fk_usuario",
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
          resultado.mensaje || "Error al crear la relación usuario-persona",
      };
    }
    return { evento: true, id_usuario_persona: resultado.id_usuario_persona };
  }

  async eliminar(id_usuario_persona) {
    const validacionId = Validador.validarId(id_usuario_persona, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_usuario_persona: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlEliminar(id_usuario_persona);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje || "Error al eliminar la relación usuario-persona",
      };
    }
    return { evento: true };
  }

  async actualizar(id_usuario_persona, campos) {
    const validacionId = Validador.validarId(id_usuario_persona, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_usuario_persona: validacionId.mensaje },
      };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_usuario_persona, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al actualizar la relación usuario-persona",
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
          "Error al consultar las relaciones usuario-persona",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    // La tabla no tiene campo estado, retorna todos
    return this.consultarTodos();
  }

  async consultarPorId(id_usuario_persona) {
    const validacionId = Validador.validarId(id_usuario_persona, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_usuario_persona: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlConsultarPorId(id_usuario_persona);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al consultar la relación usuario-persona por ID",
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
          resultado.mensaje || "Error al buscar relaciones usuario-persona",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { fk_persona, fk_usuario } = datos;
    const sql = `INSERT INTO ${this.tabla} (fk_persona, fk_usuario) VALUES (?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [fk_persona, fk_usuario]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_usuario_persona: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        // Determinar qué FK falló
        if (error.message.includes("fk_persona")) {
          return {
            evento: false,
            mensaje: { fk_persona: "La persona referenciada no existe" },
          };
        }
        if (error.message.includes("fk_usuario")) {
          return {
            evento: false,
            mensaje: { fk_usuario: "El usuario referenciado no existe" },
          };
        }
        return { evento: false, mensaje: "Violación de clave foránea" };
      }
      console.error("Error en sqlCrear (usuarioPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_usuario_persona) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_usuario_persona = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_usuario_persona]);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Relación usuario-persona no encontrada",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (usuarioPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_usuario_persona, campos) {
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
    valores.push(id_usuario_persona);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_usuario_persona = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje:
            "Relación usuario-persona no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (usuarioPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (usuarioPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_usuario_persona) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_usuario_persona = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_usuario_persona]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (usuarioPersona):", error);
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
      console.error("Error en sqlBuscarPorAtributos (usuarioPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = UsuarioPersona;
