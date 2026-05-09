const Validador = require("../Herramientas/Validador.js");

class Dependencias {
  constructor(db) {
    this.db = db;
    this.tabla = "dependencias";

    // Esquema de validación para entrada (id_dependencia es autoincremental)
    this.validacionEsquema = {
      meta_principal: {
        tipo: "number",
        obligatorio: true,
        min: 1,
      },
      meta_secundaria: {
        tipo: "number",
        obligatorio: true,
        min: 1,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_dependencia",
      "meta_principal",
      "meta_secundaria",
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
        mensaje: resultado.mensaje || "Error al crear la dependencia",
      };
    }
    return { evento: true, id_dependencia: resultado.id_dependencia };
  }

  async eliminar(id_dependencia) {
    const validacionId = Validador.validarId(id_dependencia, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_dependencia: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlEliminar(id_dependencia);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar la dependencia",
      };
    }
    return { evento: true };
  }

  async actualizar(id_dependencia, campos) {
    const validacionId = Validador.validarId(id_dependencia, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_dependencia: validacionId.mensaje },
      };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_dependencia, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar la dependencia",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar las dependencias",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    // La tabla no tiene campo estado, retorna todos
    return this.consultarTodos();
  }

  async consultarPorId(id_dependencia) {
    const validacionId = Validador.validarId(id_dependencia, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_dependencia: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlConsultarPorId(id_dependencia);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje || "Error al consultar la dependencia por ID",
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
        mensaje: resultado.mensaje || "Error al buscar dependencias",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { meta_principal, meta_secundaria } = datos;
    const sql = `INSERT INTO ${this.tabla} (meta_principal, meta_secundaria) VALUES (?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        meta_principal,
        meta_secundaria,
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_dependencia: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        // Determinar qué FK falló
        if (error.message.includes("meta_principal")) {
          return {
            evento: false,
            mensaje: {
              meta_principal: "La meta principal referenciada no existe",
            },
          };
        }
        if (error.message.includes("meta_secundaria")) {
          return {
            evento: false,
            mensaje: {
              meta_secundaria: "La meta secundaria referenciada no existe",
            },
          };
        }
        return { evento: false, mensaje: "Violación de clave foránea" };
      }
      console.error("Error en sqlCrear (dependencias):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_dependencia) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_dependencia = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_dependencia]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Dependencia no encontrada" };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (dependencias):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_dependencia, campos) {
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
    valores.push(id_dependencia);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_dependencia = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Dependencia no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (dependencias):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (dependencias):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_dependencia) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_dependencia = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_dependencia]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (dependencias):", error);
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
      console.error("Error en sqlBuscarPorAtributos (dependencias):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Dependencias;
