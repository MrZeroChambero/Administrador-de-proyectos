const Validador = require("../Herramientas/Validador.js");

class Archivos {
  constructor(db) {
    this.db = db;
    this.tabla = "archivos";

    // Esquema de validación para entrada (sin id_archivo por ser autoincremental)
    this.validacionEsquema = {
      fk_meta: {
        tipo: "number",
        obligatorio: true,
        min: 1,
      },
      tipo_activo: {
        tipo: "string",
        obligatorio: true,
        enum: ["documento", "imagen", "icono"],
      },
      nombre_archivo: {
        tipo: "string",
        obligatorio: true,
        maxLength: 2000,
      },
      ruta_archivo: {
        tipo: "string",
        obligatorio: true,
        maxLength: 2000,
      },
      extension: {
        tipo: "string",
        obligatorio: true,
        maxLength: 10,
      },
    };

    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_archivo",
      "fk_meta",
      "tipo_activo",
      "nombre_archivo",
      "ruta_archivo",
      "extension",
    ];
    this.camposAEscape = ["nombre_archivo", "ruta_archivo"];
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
        mensaje: resultado.mensaje || "Error al crear el archivo",
      };
    }
    return { evento: true, id_archivo: resultado.id_archivo };
  }

  async eliminar(id_archivo) {
    const validacionId = Validador.validarId(id_archivo, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_archivo: validacionId.mensaje } };
    }
    const resultado = await this.sqlEliminar(id_archivo);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar el archivo",
      };
    }
    return { evento: true };
  }

  async actualizar(id_archivo, campos) {
    const validacionId = Validador.validarId(id_archivo, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_archivo: validacionId.mensaje } };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_archivo, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar el archivo",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar los archivos",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    // La tabla archivos no tiene campo 'estado', se retornan todos
    return this.consultarTodos();
  }

  async consultarPorId(id_archivo) {
    const validacionId = Validador.validarId(id_archivo, "int");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_archivo: validacionId.mensaje } };
    }
    const resultado = await this.sqlConsultarPorId(id_archivo);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar el archivo por ID",
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
        mensaje: resultado.mensaje || "Error al buscar archivos",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { fk_meta, tipo_activo, nombre_archivo, ruta_archivo, extension } =
      datos;
    const sql = `INSERT INTO ${this.tabla} 
      (fk_meta, tipo_activo, nombre_archivo, ruta_archivo, extension) 
      VALUES (?, ?, ?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        fk_meta,
        tipo_activo,
        nombre_archivo,
        ruta_archivo,
        extension,
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_archivo: resultado.insertId };
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return {
          evento: false,
          mensaje: { fk_meta: "La meta referenciada no existe" },
        };
      }
      console.error("Error en sqlCrear (archivos):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_archivo) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_archivo = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_archivo]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Archivo no encontrado" };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar (archivos):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_archivo, campos) {
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
    valores.push(id_archivo);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_archivo = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Archivo no encontrado o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar (archivos):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (archivos):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_archivo) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_archivo = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_archivo]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (archivos):", error);
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
      console.error("Error en sqlBuscarPorAtributos (archivos):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Archivos;
