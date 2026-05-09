const Validador = require("../Herramientas/Validador.js");

class Configuracion {
  constructor(db) {
    this.db = db;
    this.tabla = "configuracion";

    // Esquema de validación para entrada (id_configuracion es autoincremental)
    this.validacionEsquema = {
      fk_usuario: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      letra_tamano: {
        tipo: "number",
        obligatorio: true,
        min: 0,
      },
      letra_color: {
        tipo: "string",
        obligatorio: true,
        maxLength: 30,
      },
      fk_tema: {
        tipo: "number",
        obligatorio: true,
        min: 1,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_configuracion",
      "fk_usuario",
      "letra_tamano",
      "letra_color",
      "fk_tema",
    ];
    this.camposAEscape = ["letra_color"]; // solo por si contiene HTML, aunque es un color plano
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
        mensaje: resultado.mensaje || "Error al crear la configuración",
      };
    }
    return { evento: true, id_configuracion: resultado.id_configuracion };
  }

  async eliminar(id_configuracion) {
    const validacionId = Validador.validarId(id_configuracion, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_configuracion: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlEliminar(id_configuracion);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar la configuración",
      };
    }
    return { evento: true };
  }

  async actualizar(id_configuracion, campos) {
    const validacionId = Validador.validarId(id_configuracion, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_configuracion: validacionId.mensaje },
      };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_configuracion, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar la configuración",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar las configuraciones",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    // La tabla no tiene campo estado, retorna todos
    return this.consultarTodos();
  }

  async consultarPorId(id_configuracion) {
    const validacionId = Validador.validarId(id_configuracion, "int");
    if (!validacionId.evento) {
      return {
        evento: false,
        mensaje: { id_configuracion: validacionId.mensaje },
      };
    }
    const resultado = await this.sqlConsultarPorId(id_configuracion);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje:
          resultado.mensaje || "Error al consultar la configuración por ID",
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
        mensaje: resultado.mensaje || "Error al buscar configuraciones",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { fk_usuario, letra_tamano, letra_color, fk_tema } = datos;
    const sql = `INSERT INTO ${this.tabla} 
      (fk_usuario, letra_tamano, letra_color, fk_tema) 
      VALUES (?, ?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        fk_usuario,
        letra_tamano,
        letra_color,
        fk_tema,
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_configuracion: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        // Determinar qué FK falló
        if (error.message.includes("fk_usuario")) {
          return {
            evento: false,
            mensaje: { fk_usuario: "El usuario referenciado no existe" },
          };
        }
        if (error.message.includes("fk_tema")) {
          return {
            evento: false,
            mensaje: { fk_tema: "El tema referenciado no existe" },
          };
        }
        return { evento: false, mensaje: "Violación de clave foránea" };
      }
      console.error("Error en sqlCrear (configuracion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_configuracion) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_configuracion = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_configuracion]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Configuración no encontrada" };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (configuracion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_configuracion, campos) {
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
    valores.push(id_configuracion);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_configuracion = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Configuración no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (configuracion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (configuracion):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_configuracion) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_configuracion = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_configuracion]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (configuracion):", error);
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
      console.error("Error en sqlBuscarPorAtributos (configuracion):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Configuracion;
