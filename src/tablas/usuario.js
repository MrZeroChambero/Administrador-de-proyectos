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
    await this.db.query(sql, [id_usuario, nickname, clave, estado_usuario]);
    return { id_usuario };
  }

  async eliminar(id_usuario) {
    const sql = `DELETE FROM ${this.table} WHERE id_usuario = ?`;
    await this.db.query(sql, [id_usuario]);
    return { deleted: true };
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
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE estado_usuario = 'activo'`;
    return await this.db.query(sql);
  }

  async consultarID(id_usuario) {
    const sql = `SELECT * FROM ${this.table} WHERE id_usuario = ?`;
    const rows = await this.db.query(sql, [id_usuario]);
    return rows[0] || null;
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
    return await this.db.query(sql, values);
  }
}

module.exports = Usuario;
