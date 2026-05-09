const Validador = require("../Herramientas/Validador.js");

class Meta {
  constructor(db) {
    this.db = db;
    this.tabla = "metas";

    // Esquema de validación para entrada (id_metas es autoincremental)
    // Nota: el campo 'descripcion' en la interfaz se mapea a la columna 'descripción' en BD
    this.validacionEsquema = {
      fk_objetivo: {
        tipo: "number",
        obligatorio: true,
        min: 1,
      },
      nombre_metas: {
        tipo: "string",
        obligatorio: true,
        maxLength: 800,
      },
      descripcion: {
        tipo: "string",
        obligatorio: true,
        maxLength: 2000,
      },
      fecha_fin: {
        tipo: "string",
        obligatorio: true,
        fecha: true,
      },
      fk_informacion: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    // En la salida se usará 'descripcion' (sin acento) en lugar de 'descripción'
    this.camposPermitidosSalida = [
      "id_metas",
      "fk_objetivo",
      "nombre_metas",
      "descripcion",
      "fecha_fin",
      "fk_informacion",
    ];
    this.camposAEscape = ["nombre_metas", "descripcion"];
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

  // Convierte filas de BD (con columna 'descripción') a objeto de salida (con 'descripcion')
  mapearResultado(fila) {
    if (!fila) return null;
    const mapeado = { ...fila };
    if (mapeado.descripción !== undefined) {
      mapeado.descripcion = mapeado.descripción;
      delete mapeado.descripción;
    }
    return mapeado;
  }

  mapearResultados(filas) {
    if (!Array.isArray(filas)) return filas;
    return filas.map((f) => this.mapearResultado(f));
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
        mensaje: resultado.mensaje || "Error al crear la meta",
      };
    }
    return { evento: true, id_metas: resultado.id_metas };
  }

  async eliminar(id_metas) {
    const validacionId = Validador.validarId(id_metas, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_metas: validacionId.mensaje } };
    }
    const resultado = await this.sqlEliminar(id_metas);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar la meta",
      };
    }
    return { evento: true };
  }

  async actualizar(id_metas, campos) {
    const validacionId = Validador.validarId(id_metas, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_metas: validacionId.mensaje } };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_metas, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar la meta",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar las metas",
      };
    }
    const datosMapeados = this.mapearResultados(resultado.datos);
    const datosSeguros = this.sanitizarSalida(datosMapeados);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    const resultado = await this.sqlConsultarActivos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar metas activas",
      };
    }
    const datosMapeados = this.mapearResultados(resultado.datos);
    const datosSeguros = this.sanitizarSalida(datosMapeados);
    return { evento: true, datos: datosSeguros };
  }

  async consultarPorId(id_metas) {
    const validacionId = Validador.validarId(id_metas, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_metas: validacionId.mensaje } };
    }
    const resultado = await this.sqlConsultarPorId(id_metas);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar la meta por ID",
      };
    }
    const datosMapeados = this.mapearResultado(resultado.datos);
    const datosSeguros = this.sanitizarSalida(datosMapeados);
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
        mensaje: resultado.mensaje || "Error al buscar metas",
      };
    }
    const datosMapeados = this.mapearResultados(resultado.datos);
    const datosSeguros = this.sanitizarSalida(datosMapeados);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const {
      fk_objetivo,
      nombre_metas,
      descripcion,
      fecha_fin,
      fk_informacion,
    } = datos;
    // Mapear descripcion -> descripción (columna real en BD)
    const sql = `INSERT INTO ${this.tabla} 
      (fk_objetivo, nombre_metas, \`descripción\`, fecha_fin, fk_informacion) 
      VALUES (?, ?, ?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        fk_objetivo,
        nombre_metas,
        descripcion,
        fecha_fin,
        fk_informacion,
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_metas: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        // Determinar qué FK falló
        if (error.message.includes("fk_objetivo")) {
          return {
            evento: false,
            mensaje: { fk_objetivo: "El objetivo referenciado no existe" },
          };
        }
        if (error.message.includes("fk_informacion")) {
          return {
            evento: false,
            mensaje: {
              fk_informacion: "La información referenciada no existe",
            },
          };
        }
        return { evento: false, mensaje: "Violación de clave foránea" };
      }
      console.error("Error en sqlCrear (meta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_metas) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_metas = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_metas]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Meta no encontrada" };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (meta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_metas, campos) {
    const camposPermitidos = Object.keys(this.validacionEsquema);
    const actualizaciones = [];
    const valores = [];
    for (let [clave, valor] of Object.entries(campos)) {
      if (camposPermitidos.includes(clave) && valor !== undefined) {
        // Mapear descripcion -> descripción para la BD
        let columna = clave;
        if (clave === "descripcion") columna = "descripción";
        actualizaciones.push(`\`${columna}\` = ?`);
        valores.push(valor);
      }
    }
    if (actualizaciones.length === 0) {
      return {
        evento: false,
        mensaje: "No hay campos válidos para actualizar",
      };
    }
    valores.push(id_metas);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_metas = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Meta no encontrada o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (meta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (meta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarActivos() {
    // Metas activas: aquellas cuya fecha_fin no ha pasado
    const sql = `SELECT * FROM ${this.tabla} WHERE fecha_fin >= CURDATE()`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarActivos (meta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_metas) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_metas = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_metas]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (meta):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlBuscarPorAtributos(atributos) {
    const condiciones = [];
    const valores = [];
    for (let [clave, valor] of Object.entries(atributos)) {
      if (this.validacionEsquema[clave]) {
        let columna = clave;
        if (clave === "descripcion") columna = "descripción";
        condiciones.push(`\`${columna}\` = ?`);
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
      console.error("Error en sqlBuscarPorAtributos (meta):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Meta;
