class Temas {
  constructor(db) {
    this.db = db;
    this.table = "temas";
    this.esquemaValidacion = {
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
      fecha_creacion: { tipo: "string", obligatorio: true, fecha: true },
      id_proyecto: {
        tipo: "string",
        obligatorio: true,
        sinCaracteresEspeciales: true,
        maxLength: 50,
      },
    };
  }
  // Método de validación reutilizable
  validarDatos(datos, paraActualizacion = false) {
    // Si es actualización, algunos campos pueden no ser obligatorios
    let esquema = { ...this.esquemaValidacion };
    if (paraActualizacion) {
      // En actualización, ningún campo es obligatorio (solo los que se envían)
      for (let key in esquema) {
        esquema[key] = { ...esquema[key], obligatorio: false };
      }
      // Pero el id_tema no se valida aquí (se valida aparte)
    }
    return Validador.validar(datos, esquema);
  }

  async crear(datos) {
    const { color } = datos;
    const sql = `INSERT INTO ${this.table} (color) VALUES (?)`;
    const resultado = await this.db.query(sql, [color]);
    if (resultado.affectedRows === 0) {
      return { id_tema: null, evento: false };
    }
    return { id_tema: resultado.insertId, evento: true };
  }

  async eliminar(id_tema) {
    const sql = `DELETE FROM ${this.table} WHERE id_tema = ?`;
    const resultado = await this.db.query(sql, [id_tema]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
  }

  async actualizar(id_tema, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_tema);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_tema = ?`;
    const resultado = await this.db.query(sql, values);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    const resultado = await this.db.query(sql);
    if (!resultado) {
      return { evento: false };
    }
    return { evento: true, data: resultado };
  }

  async consultarActivos() {
    // Todos los temas se consideran activos
    return await this.consultarTodos();
  }

  async consultarID(id_tema) {
    const sql = `SELECT * FROM ${this.table} WHERE id_tema = ?`;
    const resultado = await this.db.query(sql, [id_tema]);
    if (resultado.length === 0) {
      return { evento: true, data: null };
    }
    return { evento: true, data: resultado[0] || null };
  }

  async buscarPorAtributos(atributos) {
    const conditions = [],
      values = [];
    for (const [key, value] of Object.entries(atributos)) {
      conditions.push(`${key} = ?`);
      values.push(value);
    }
    const sql = `SELECT * FROM ${this.table} ${
      conditions.length ? "WHERE " + conditions.join(" AND ") : ""
    }`;
    const resultado = await this.db.query(sql, values);
    if (resultado.length === 0) {
      return { evento: true, data: [] };
    }
    return { evento: true, data: resultado };
  }
}

module.exports = Temas;
