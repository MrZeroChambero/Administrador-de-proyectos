const Validador = require("../Herramientas/Validador.js");

class Personas {
  constructor(db) {
    this.db = db;
    this.tabla = "personas";

    // Esquema de validación para entrada (id_persona es string, no autoincremental)
    this.validacionEsquema = {
      id_persona: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      primer_nombre: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 100,
      },
      segundo_nombre: {
        tipo: "string",
        obligatorio: false,
        sinCaracteresEspeciales: true,
        maxLength: 100,
      },
      primer_apellido: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 100,
      },
      segundo_apellido: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 100,
      },
      foto: {
        tipo: "string",
        obligatorio: false,
        maxLength: 200,
      },
      dni: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 20,
      },
      correo1: {
        tipo: "string",
        obligatorio: true,
        maxLength: 100,
        // Podría agregarse validación de email, pero se deja genérico
      },
      correo2: {
        tipo: "string",
        obligatorio: false,
        maxLength: 100,
      },
      tlf1: {
        tipo: "string",
        obligatorio: true,
        maxLength: 30,
      },
      tlf2: {
        tipo: "string",
        obligatorio: false,
        maxLength: 30,
      },
      estado_persona: {
        tipo: "string",
        obligatorio: false,
        enum: ["activo", "inactivo"],
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_persona",
      "primer_nombre",
      "segundo_nombre",
      "primer_apellido",
      "segundo_apellido",
      "foto",
      "dni",
      "correo1",
      "correo2",
      "tlf1",
      "tlf2",
      "estado_persona",
    ];
    this.camposAEscape = [
      "primer_nombre",
      "segundo_nombre",
      "primer_apellido",
      "segundo_apellido",
      "dni",
      "correo1",
      "correo2",
      "tlf1",
      "tlf2",
    ]; // Escapar posibles HTML
  }

  // Método de validación reutilizable
  validarDatos(datos, esActualizacion = false) {
    let esquema = { ...this.validacionEsquema };
    if (esActualizacion) {
      for (let clave in esquema) {
        esquema[clave] = { ...esquema[clave], obligatorio: false };
      }
      delete esquema.id_persona; // No se puede actualizar la clave primaria
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
        mensaje: resultado.mensaje || "Error al crear la persona",
      };
    }
    return { evento: true, id_persona: resultado.id_persona };
  }

  async eliminar(id_persona) {
    const validacionId = Validador.validarId(id_persona, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_persona: validacionId.mensaje } };
    }
    const resultado = await this.sqlEliminar(id_persona);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar la persona",
      };
    }
    return { evento: true };
  }

  async actualizar(id_persona, campos) {
    const validacionId = Validador.validarId(id_persona, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_persona: validacionId.mensaje } };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_persona, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar la persona",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar las personas",
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
        mensaje: resultado.mensaje || "Error al consultar personas activas",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarPorId(id_persona) {
    const validacionId = Validador.validarId(id_persona, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_persona: validacionId.mensaje } };
    }
    const resultado = await this.sqlConsultarPorId(id_persona);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar la persona por ID",
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
        mensaje: resultado.mensaje || "Error al buscar personas",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const {
      id_persona,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      foto,
      dni,
      correo1,
      correo2,
      tlf1,
      tlf2,
      estado_persona,
    } = datos;
    const sql = `INSERT INTO ${this.tabla} 
      (id_persona, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
       foto, dni, correo1, correo2, tlf1, tlf2, estado_persona) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        id_persona,
        primer_nombre,
        segundo_nombre || null,
        primer_apellido,
        segundo_apellido || null,
        foto || null,
        dni,
        correo1,
        correo2 || null,
        tlf1,
        tlf2 || null,
        estado_persona || "activo",
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_persona };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return {
          evento: false,
          mensaje: { id_persona: "El ID de persona ya existe" },
        };
      }
      console.error("Error en sqlCrear (personas):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_persona) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_persona = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_persona]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Persona no encontrada" };
      }
      return { evento: true };
    } catch (error) {
      // Si hay registros relacionados con ON DELETE CASCADE no debería fallar,
      // pero en caso de RESTRICT se captura el error
      if (error.code === "ER_ROW_IS_REFERENCED") {
        return {
          evento: false,
          mensaje:
            "No se puede eliminar la persona porque tiene registros relacionados",
        };
      }
      console.error("Error en sqlEliminar (personas):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_persona, campos) {
    const camposPermitidos = Object.keys(this.validacionEsquema).filter(
      (clave) => clave !== "id_persona"
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
    valores.push(id_persona);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_persona = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Persona no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (personas):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (personas):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarActivos() {
    const sql = `SELECT * FROM ${this.tabla} WHERE estado_persona = 'activo'`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarActivos (personas):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_persona) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_persona = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_persona]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (personas):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlBuscarPorAtributos(atributos) {
    const condiciones = [];
    const valores = [];
    for (const [clave, valor] of Object.entries(atributos)) {
      if (this.validacionEsquema[clave] && clave !== "id_persona") {
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
      console.error("Error en sqlBuscarPorAtributos (personas):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Personas;
