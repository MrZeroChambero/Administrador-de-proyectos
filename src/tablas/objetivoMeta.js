class ObjetivoMeta {
  constructor(db) {
    this.db = db;
    this.table = "objetivo_meta";
  }

  async crear(datos) {
    const { fk_objetivo, fk_meta } = datos;
    const sql = `INSERT INTO ${this.table} (fk_objetivo, fk_meta) VALUES (?, ?)`;
    const result = await this.db.query(sql, [fk_objetivo, fk_meta]);
    return { id_objetivo_meta: result.insertId };
  }

  async eliminar(id_objetivo_meta) {
    const sql = `DELETE FROM ${this.table} WHERE id_objetivo_meta = ?`;
    await this.db.query(sql, [id_objetivo_meta]);
    return { deleted: true };
  }

  async actualizar(id_objetivo_meta, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_objetivo_meta);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_objetivo_meta = ?`;
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  async consultarActivos() {
    // No tiene campo de estado, retorna todos
    return await this.consultarTodos();
  }

  async consultarID(id_objetivo_meta) {
    const sql = `SELECT * FROM ${this.table} WHERE id_objetivo_meta = ?`;
    const rows = await this.db.query(sql, [id_objetivo_meta]);
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

module.exports = ObjetivoMeta;
