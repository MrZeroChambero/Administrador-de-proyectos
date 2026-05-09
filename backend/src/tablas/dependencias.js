class Dependencias {
  constructor(db) {
    this.db = db;
    this.table = "dependencias";
  }

  async crear(datos) {
    const { meta_principal, meta_secundaria } = datos;
    const sql = `INSERT INTO ${this.table} (meta_principal, meta_secundaria) VALUES (?, ?)`;
    const resultado = await this.db.query(sql, [
      meta_principal,
      meta_secundaria,
    ]);
    if (resultado.affectedRows === 0) {
      return { id_dependencia: null, evento: false };
    }
    return { id_dependencia: resultado.insertId, evento: true };
  }

  async eliminar(id_dependencia) {
    const sql = `DELETE FROM ${this.table} WHERE id_dependencia = ?`;
    const resultado = await this.db.query(sql, [id_dependencia]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
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
    // Sin campo de estado, retorna todos
    return await this.consultarTodos();
  }

  async consultarID(id_dependencia) {
    const sql = `SELECT * FROM ${this.table} WHERE id_dependencia = ?`;
    const resultado = await this.db.query(sql, [id_dependencia]);
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

module.exports = Dependencias;
