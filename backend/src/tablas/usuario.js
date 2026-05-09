class Usuario {
  constructor(db) {
    this.db = db;
    this.table = "usuario";
  }

  async crear(datos) {
    const { id_usuario, nickname, clave, estado_usuario } = datos;
    const sql = `INSERT INTO ${this.table} 
      (id_usuario, nickname, clave, estado_usuario) 
      VALUES (?, ?, ?, ?)`;
    const resultado = await this.db.query(sql, [
      id_usuario,
      nickname,
      clave,
      estado_usuario,
    ]);
    if (resultado.affectedRows === 0) {
      return { id_usuario: null, evento: false };
    }
    return { id_usuario: resultado.insertId, evento: true };
  }

  async eliminar(id_usuario) {
    const sql = `DELETE FROM ${this.table} WHERE id_usuario = ?`;
    const resultado = await this.db.query(sql, [id_usuario]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
  }

  async actualizar(id_usuario, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_usuario);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_usuario = ?`;
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
    const sql = `SELECT * FROM ${this.table} WHERE estado_usuario = 'activo'`;
    const resultado = await this.db.query(sql);
    if (!resultado) {
      return { evento: false };
    }
    return { evento: true, data: resultado };
  }

  async consultarID(id_usuario) {
    const sql = `SELECT * FROM ${this.table} WHERE id_usuario = ?`;
    const resultado = await this.db.query(sql, [id_usuario]);
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

module.exports = Usuario;
