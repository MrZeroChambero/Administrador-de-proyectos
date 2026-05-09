class ObjetivoMeta {
  constructor(db) {
    this.db = db;
    this.table = "objetivo_meta";
  }

  async crear(datos) {
    const { fk_objetivo, fk_meta } = datos;
    const sql = `INSERT INTO ${this.table} (fk_objetivo, fk_meta) VALUES (?, ?)`;
    const resultado = await this.db.query(sql, [fk_objetivo, fk_meta]);
    if (resultado.affectedRows === 0) {
      return { id_objetivo_meta: null, evento: false };
    }
    return { id_objetivo_meta: resultado.insertId, evento: true };
  }

  async eliminar(id_objetivo_meta) {
    const sql = `DELETE FROM ${this.table} WHERE id_objetivo_meta = ?`;
    const resultado = await this.db.query(sql, [id_objetivo_meta]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
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

  async consultarActivos() {
    // No tiene campo de estado, retorna todos
    return await this.consultarTodos();
  }

  async consultarID(id_objetivo_meta) {
    const sql = `SELECT * FROM ${this.table} WHERE id_objetivo_meta = ?`;
    const resultado = await this.db.query(sql, [id_objetivo_meta]);
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

module.exports = ObjetivoMeta;
