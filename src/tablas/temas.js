class Temas {
  constructor(db) {
    this.db = db;
    this.table = "temas";
  }

  async crear(datos) {
    const { color } = datos;
    const sql = `INSERT INTO ${this.table} (color) VALUES (?)`;
    const result = await this.db.query(sql, [color]);
    return { id_tema: result.insertId };
  }

  async eliminar(id_tema) {
    const sql = `DELETE FROM ${this.table} WHERE id_tema = ?`;
    await this.db.query(sql, [id_tema]);
    return { deleted: true };
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
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  async consultarActivos() {
    // Todos los temas se consideran activos
    return await this.consultarTodos();
  }

  async consultarID(id_tema) {
    const sql = `SELECT * FROM ${this.table} WHERE id_tema = ?`;
    const rows = await this.db.query(sql, [id_tema]);
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

module.exports = Temas;
