class Dependencias {
  constructor(db) {
    this.db = db;
    this.table = "dependencias";
  }

  async crear(datos) {
    const { meta_principal, meta_secundaria } = datos;
    const sql = `INSERT INTO ${this.table} (meta_principal, meta_secundaria) VALUES (?, ?)`;
    const result = await this.db.query(sql, [meta_principal, meta_secundaria]);
    return { id_dependencia: result.insertId };
  }

  async eliminar(id_dependencia) {
    const sql = `DELETE FROM ${this.table} WHERE id_dependencia = ?`;
    await this.db.query(sql, [id_dependencia]);
    return { deleted: true };
  }

  async actualizar(id_dependencia, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_dependencia);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_dependencia = ?`;
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

  async consultarID(id_dependencia) {
    const sql = `SELECT * FROM ${this.table} WHERE id_dependencia = ?`;
    const rows = await this.db.query(sql, [id_dependencia]);
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

module.exports = Dependencias;
