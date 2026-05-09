const Validador = require("../Herramientas/Validador.js");

class Temas {
  constructor(db) {
    this.db = db;
    this.tabla = "temas";

    // Esquema de validación para entrada
    this.validacionEsquema = {
      id_tema: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        minLength: 1,
        maxLength: 50,
      },
      nombre: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        minLength: 3,
        maxLength: 100,
      },
      descripcion: {
        tipo: "string",
        obligatorio: false,
        sinCaracteresEspeciales: true,
        maxLength: 500,
      },
      estado: {
        tipo: "string",
        obligatorio: false,
        enum: ["activo", "inactivo"],
      },
      fecha_creacion: {
        tipo: "string",
        obligatorio: true,
        fecha: true,
      },
      id_proyecto: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 50,
      },
    };
    // Configuración de salida (campos permitidos y campos a escapar)
    this.camposPermitidosSalida = [
      "id_tema",
      "nombre",
      "descripcion",
      "estado",
      "fecha_creacion",
      "id_proyecto",
    ];
    this.camposAEscape = ["nombre", "descripcion"]; // estos campos pueden contener HTML
  }

  // Método de validación reutilizable (devuelve { valido, errores })
  validarDatos(datos, esActualizacion = false) {
    let esquema = { ...this.validacionEsquema };
    if (esActualizacion) {
      for (let clave in esquema) {
        esquema[clave] = { ...esquema[clave], obligatorio: false };
      }
      delete esquema.id_tema;
    }
    const resultadoValidacion = Validador.validar(datos, esquema);
    if (resultadoValidacion.evento) {
      return { valido: true, errores: null };
    } else {
      return { valido: false, errores: resultadoValidacion.mensaje };
    }
  }

  // Método auxiliar para sanitizar la salida (aplica a un objeto o array)
  sanitizarSalida(datos) {
    return Validador.sanitizarSalida(
      datos,
      this.camposPermitidosSalida,
      this.camposAEscape
    );
  }

  // --- Métodos públicos (todos asíncronos) ---

  async crear(datos) {
    const validacion = this.validarDatos(datos, false);
    if (!validacion.valido) {
      return { evento: false, mensaje: validacion.errores };
    }
    const resultado = await this.sqlCrear(datos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al crear el tema",
      };
    }
    return { evento: true, id_tema: resultado.id_tema };
  }

  async eliminar(id_tema) {
    const validacionId = Validador.validarId(id_tema, "uuid");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_tema: validacionId.mensaje } };
    }
    const resultado = await this.sqlEliminar(id_tema);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar el tema",
      };
    }
    return { evento: true };
  }

  async actualizar(id_tema, campos) {
    const validacionId = Validador.validarId(id_tema, "uuid");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_tema: validacionId.mensaje } };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_tema, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar el tema",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar los temas",
      };
    }
    // Sanitizar los datos de salida
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarActivos() {
    const resultado = await this.sqlConsultarActivos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar temas activos",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarPorId(id_tema) {
    const validacionId = Validador.validarId(id_tema, "uuid");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_tema: validacionId.mensaje } };
    }
    const resultado = await this.sqlConsultarPorId(id_tema);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar el tema por ID",
      };
    }
    // Si es un solo objeto, sanitizamos igualmente
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
        mensaje: resultado.mensaje || "Error al buscar temas",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL (todos asíncronos) ---

  async sqlCrear(datos) {
    const {
      id_tema,
      nombre,
      descripcion,
      estado,
      fecha_creacion,
      id_proyecto,
    } = datos;
    const sql = `INSERT INTO ${this.tabla} 
      (id_tema, nombre, descripcion, estado, fecha_creacion, id_proyecto) 
      VALUES (?, ?, ?, ?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        id_tema,
        nombre,
        descripcion || null,
        estado || "activo",
        fecha_creacion,
        id_proyecto,
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_tema };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return {
          evento: false,
          mensaje: { id_tema: "El ID del tema ya existe" },
        };
      }
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return {
          evento: false,
          mensaje: { id_proyecto: "El proyecto referenciado no existe" },
        };
      }
      console.error("Error en sqlCrear:", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_tema) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_tema = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_tema]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Tema no encontrado" };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlEliminar:", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_tema, campos) {
    const camposPermitidos = Object.keys(this.validacionEsquema).filter(
      (clave) => clave !== "id_tema"
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
    valores.push(id_tema);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_tema = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Tema no encontrado o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      console.error("Error en sqlActualizar:", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos:", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarActivos() {
    const sql = `SELECT * FROM ${this.tabla} WHERE estado = 'activo'`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarActivos:", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_tema) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_tema = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_tema]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId:", error);
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
      console.error("Error en sqlBuscarPorAtributos:", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Temas;
