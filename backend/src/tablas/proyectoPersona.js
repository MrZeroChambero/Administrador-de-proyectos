const Validador = require("../Herramientas/Validador.js");

class ProyectoPersona {
  constructor(db) {
    this.db = db;
    this.tabla = "proyecto_persona";

    // Esquema de validación para entrada (id_proyecto_persona es autoincremental)
    // Nota: el campo se llama "prosito" en la BD (posiblemente "propósito", pero se respeta)
    this.validacionEsquema = {
      fk_persona: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      fk_proyecto: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      prosito: {
        tipo: "string",
        obligatorio: true,
        maxLength: 200,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_proyecto_persona",
      "fk_persona",
      "fk_proyecto",
      "prosito",
    ];
    this.camposAEscape = ["prosito"]; // Puede contener HTML
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
          resultado.mensaje || "Error al crear la relación proyecto-persona",
      };
    }
    return { evento: true, id_proyecto_persona: resultado.id_proyecto_persona };
  }

  async eliminar(id_proyecto_persona) {
    const validacionId = Validador.validarId(id_proyecto_persona, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_proyecto_persona: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlEliminar(id_proyecto_persona);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje || "Error al eliminar la relación proyecto-persona",
      };
    }
    return { evento: true };
  }

  async actualizar(id_proyecto_persona, campos) {
    const validacionId = Validador.validarId(id_proyecto_persona, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_proyecto_persona: validacionId.mensaje },
      };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_proyecto_persona, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al actualizar la relación proyecto-persona",
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
          "Error al consultar las relaciones proyecto-persona",
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
          resultado.mensaje ||
          "Error al consultar relaciones activas proyecto-persona",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarPorId(id_proyecto_persona) {
    const validacionId = Validador.validarId(id_proyecto_persona, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_proyecto_persona: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlConsultarPorId(id_proyecto_persona);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje ||
          "Error al consultar la relación proyecto-persona por ID",
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
          resultado.mensaje || "Error al buscar relaciones proyecto-persona",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { fk_persona, fk_proyecto, prosito } = datos;
    const sql = `INSERT INTO ${this.tabla} (fk_persona, fk_proyecto, prosito) VALUES (?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        fk_persona,
        fk_proyecto,
        prosito,
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_proyecto_persona: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        // Determinar qué FK falló
        if (error.message.includes("fk_persona")) {
          return {
            evento: false,
            mensaje: { fk_persona: "La persona referenciada no existe" },
          };
        }
        if (error.message.includes("fk_proyecto")) {
          return {
            evento: false,
            mensaje: { fk_proyecto: "El proyecto referenciado no existe" },
          };
        }
        return { evento: false, mensaje: "Violación de clave foránea" };
      }
      console.error("Error en sqlCrear (proyectoPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_proyecto_persona) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_proyecto_persona = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_proyecto_persona]);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Relación proyecto-persona no encontrada",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (proyectoPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_proyecto_persona, campos) {
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
    valores.push(id_proyecto_persona);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_proyecto_persona = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje:
            "Relación proyecto-persona no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (proyectoPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (proyectoPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarActivos() {
    // Relaciones activas: persona activa y proyecto en estado 'en espera' o 'en progreso'
    const sql = `
      SELECT pp.* 
      FROM ${this.tabla} pp
      JOIN personas p ON pp.fk_persona = p.id_persona
      JOIN proyecto pr ON pp.fk_proyecto = pr.id_proyecto
      WHERE p.estado_persona = 'activo' 
        AND pr.estado_proyecto IN ('en espera', 'en progreso')
    `;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarActivos (proyectoPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_proyecto_persona) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_proyecto_persona = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_proyecto_persona]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (proyectoPersona):", error);
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
      console.error("Error en sqlBuscarPorAtributos (proyectoPersona):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = ProyectoPersona;
