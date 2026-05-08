class UsuarioPersona {
  constructor(db) {
    this.db = db;
    this.table = "usuario_persona";
  }

  async crear(datos) {
    const { fk_persona, fk_usuario } = datos;
    const sql = `INSERT INTO ${this.table} (fk_persona, fk_usuario) VALUES (?, ?)`;
    const result = await this.db.query(sql, [fk_persona, fk_usuario]);
    return { id_usuario_persona: result.insertId };
  }

  async eliminar(id_usuario_persona) {
    const sql = `DELETE FROM ${this.table} WHERE id_usuario_persona = ?`;
    await this.db.query(sql, [id_usuario_persona]);
    return { deleted: true };
  }

  async actualizar(id_usuario_persona, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_usuario_persona);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_usuario_persona = ?`;
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  async consultarActivos() {
    // Sin campo de estado, retorna todos
    return await this.consultarTodos();
  }

  async consultarID(id_usuario_persona) {
    const sql = `SELECT * FROM ${this.table} WHERE id_usuario_persona = ?`;
    const rows = await this.db.query(sql, [id_usuario_persona]);
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

module.exports = UsuarioPersona;
