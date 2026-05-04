class PersonaMetas {
  constructor(db) {
    this.db = db;
    this.table = "persona_metas";
  }

  async crear(datos) {
    const { fk_persona, fk_meta, prosito } = datos;
    const sql = `INSERT INTO ${this.table} (fk_persona, fk_meta, prosito) VALUES (?, ?, ?)`;
    const result = await this.db.query(sql, [fk_persona, fk_meta, prosito]);
    return { id_persona_metas: result.insertId };
  }

  async eliminar(id_persona_metas) {
    const sql = `DELETE FROM ${this.table} WHERE id_persona_metas = ?`;
    await this.db.query(sql, [id_persona_metas]);
    return { deleted: true };
  }

  async actualizar(id_persona_metas, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_persona_metas);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_persona_metas = ?`;
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  // No tiene campo de estado, retorna todos
  async consultarActivos() {
    return await this.consultarTodos();
  }

  async consultarID(id_persona_metas) {
    const sql = `SELECT * FROM ${this.table} WHERE id_persona_metas = ?`;
    const rows = await this.db.query(sql, [id_persona_metas]);
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

module.exports = PersonaMetas;
