const Validador = require("../Herramientas/Validador.js");

class Usuario {
  constructor(db) {
    this.db = db;
    this.tabla = "usuario";

    // Esquema de validación para entrada (id_usuario es string, no autoincremental)
    this.validacionEsquema = {
      id_usuario: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 30,
      },
      nickname: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true, // evita inyección y caracteres raros
        maxLength: 40,
      },
      clave: {
        tipo: "string",
        obligatorio: true,
        minLength: 8,
        maxLength: 255,
        // NOTA: se asume que la contraseña ya llega hasheada desde el controlador
      },
      estado_usuario: {
        tipo: "string",
        obligatorio: false,
        enum: ["activo", "inactivo"],
      },
    };

    // Configuración de salida: NO incluimos 'clave' por seguridad
    this.camposPermitidosSalida = ["id_usuario", "nickname", "estado_usuario"];
    this.camposAEscape = ["nickname"]; // campos que pueden contener HTML
  }

  // Método de validación reutilizable
  validarDatos(datos, esActualizacion = false) {
    let esquema = { ...this.validacionEsquema };
    if (esActualizacion) {
      for (let clave in esquema) {
        esquema[clave] = { ...esquema[clave], obligatorio: false };
      }
      delete esquema.id_usuario; // No se puede modificar la clave primaria
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
        mensaje: resultado.mensaje || "Error al crear el usuario",
      };
    }
    return { evento: true, id_usuario: resultado.id_usuario };
  }

  async eliminar(id_usuario) {
    const validacionId = Validador.validarId(id_usuario, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_usuario: validacionId.mensaje } };
    }
    const resultado = await this.sqlEliminar(id_usuario);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al eliminar el usuario",
      };
    }
    return { evento: true };
  }

  async actualizar(id_usuario, campos) {
    const validacionId = Validador.validarId(id_usuario, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_usuario: validacionId.mensaje } };
    }
    const validacionCampos = this.validarDatos(campos, true);
    if (!validacionCampos.valido) {
      return { evento: false, mensaje: validacionCampos.errores };
    }
    const resultado = await this.sqlActualizar(id_usuario, campos);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al actualizar el usuario",
      };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const resultado = await this.sqlConsultarTodos();
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar los usuarios",
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
        mensaje: resultado.mensaje || "Error al consultar usuarios activos",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  async consultarPorId(id_usuario) {
    const validacionId = Validador.validarId(id_usuario, "string");
    if (!validacionId.evento) {
      return { evento: false, mensaje: { id_usuario: validacionId.mensaje } };
    }
    const resultado = await this.sqlConsultarPorId(id_usuario);
    if (!resultado.evento) {
      return {
        evento: false,
        mensaje: resultado.mensaje || "Error al consultar el usuario por ID",
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
        mensaje: resultado.mensaje || "Error al buscar usuarios",
      };
    }
    const datosSeguros = this.sanitizarSalida(resultado.datos);
    return { evento: true, datos: datosSeguros };
  }

  // --- Métodos privados SQL ---

  async sqlCrear(datos) {
    const { id_usuario, nickname, clave, estado_usuario } = datos;
    const sql = `INSERT INTO ${this.tabla} 
      (id_usuario, nickname, clave, estado_usuario) 
      VALUES (?, ?, ?, ?)`;
    try {
      const [resultado] = await this.db.query(sql, [
        id_usuario,
        nickname,
        clave,
        estado_usuario || "activo",
      ]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "No se insertó ninguna fila" };
      }
      return { evento: true, id_usuario };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        // Puede ser duplicado de id_usuario o nickname (ambos tienen restricciones únicas)
        if (error.message.includes("PRIMARY")) {
          return {
            evento: false,
            mensaje: { id_usuario: "El ID de usuario ya existe" },
          };
        }
        if (error.message.includes("nickname")) {
          return {
            evento: false,
            mensaje: { nickname: "El nickname ya está en uso" },
          };
        }
        return { evento: false, mensaje: "Registro duplicado" };
      }
      console.error("Error en sqlCrear (usuario):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlEliminar(id_usuario) {
    const sql = `DELETE FROM ${this.tabla} WHERE id_usuario = ?`;
    try {
      const [resultado] = await this.db.query(sql, [id_usuario]);
      if (resultado.affectedRows === 0) {
        return { evento: false, mensaje: "Usuario no encontrado" };
      }
      return { evento: true };
    } catch (error) {
      // Si hay referencias de otras tablas con ON DELETE RESTRICT
      if (error.code === "ER_ROW_IS_REFERENCED") {
        return {
          evento: false,
          mensaje:
            "No se puede eliminar el usuario porque tiene registros relacionados",
        };
      }
      console.error("Error en sqlEliminar (usuario):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlActualizar(id_usuario, campos) {
    const camposPermitidos = Object.keys(this.validacionEsquema).filter(
      (clave) => clave !== "id_usuario"
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
    valores.push(id_usuario);
    const sql = `UPDATE ${this.tabla} SET ${actualizaciones.join(
      ", "
    )} WHERE id_usuario = ?`;
    try {
      const [resultado] = await this.db.query(sql, valores);
      if (resultado.affectedRows === 0) {
        return {
          evento: false,
          mensaje: "Usuario no encontrado o ningún cambio realizado",
        };
      }
      return { evento: true };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return {
          evento: false,
          mensaje: { nickname: "El nickname ya está en uso" },
        };
      }
      console.error("Error en sqlActualizar (usuario):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarTodos() {
    const sql = `SELECT * FROM ${this.tabla}`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarTodos (usuario):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarActivos() {
    const sql = `SELECT * FROM ${this.tabla} WHERE estado_usuario = 'activo'`;
    try {
      const [filas] = await this.db.query(sql);
      return { evento: true, datos: filas };
    } catch (error) {
      console.error("Error en sqlConsultarActivos (usuario):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlConsultarPorId(id_usuario) {
    const sql = `SELECT * FROM ${this.tabla} WHERE id_usuario = ?`;
    try {
      const [filas] = await this.db.query(sql, [id_usuario]);
      if (filas.length === 0) {
        return { evento: true, datos: null };
      }
      return { evento: true, datos: filas[0] };
    } catch (error) {
      console.error("Error en sqlConsultarPorId (usuario):", error);
      return { evento: false, mensaje: error.message };
    }
  }

  async sqlBuscarPorAtributos(atributos) {
    const condiciones = [];
    const valores = [];
    for (const [clave, valor] of Object.entries(atributos)) {
      if (this.validacionEsquema[clave] && clave !== "id_usuario") {
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
      console.error("Error en sqlBuscarPorAtributos (usuario):", error);
      return { evento: false, mensaje: error.message };
    }
  }
}

module.exports = Usuario;
