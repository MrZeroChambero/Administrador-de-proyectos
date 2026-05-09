class PersonaMetas {
  constructor(db) {
    this.db = db;
    this.table = "persona_metas";
  }

  async crear(datos) {
    const { fk_persona, fk_meta, prosito } = datos;
    const sql = `INSERT INTO ${this.table} (fk_persona, fk_meta, prosito) VALUES (?, ?, ?)`;
    const result = await this.db.query(sql, [fk_persona, fk_meta, prosito]);
    if (result.affectedRows === 0) {
      return { id_persona_metas: null, evento: false };
    }
    return { id_persona_metas: result.insertId, evento: true };
  }

  async eliminar(id_persona_metas) {
    const sql = `DELETE FROM ${this.table} WHERE id_persona_metas = ?`;
    const resultado = await this.db.query(sql, [id_persona_metas]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
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
    if (updates.length === 0) {
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

  // No tiene campo de estado, retorna todos
  async consultarActivos() {
    return await this.consultarTodos();
  }

  async consultarID(id_persona_metas) {
    const sql = `SELECT * FROM ${this.table} WHERE id_persona_metas = ?`;
    const resultado = await this.db.query(sql, [id_persona_metas]);
    if (resultado.length === 0) {
      return { evento: true, data: null };
    }
    return { evento: true, data: resultado[0] };
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

module.exports = PersonaMetas;
