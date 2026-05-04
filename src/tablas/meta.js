class Meta {
  constructor(db) {
    this.db = db;
    this.table = "metas";
  }

  async crear(datos) {
    const {
      fk_objetivo,
      nombre_metas,
      descripción,
      fecha_fin,
      fk_informacion,
    } = datos;
    const sql = `INSERT INTO ${this.table} 
      (fk_objetivo, nombre_metas, \`descripción\`, fecha_fin, fk_informacion) 
      VALUES (?, ?, ?, ?, ?)`;
    const result = await this.db.query(sql, [
      fk_objetivo,
      nombre_metas,
      descripción,
      fecha_fin,
      fk_informacion,
    ]);
    return { id_metas: result.insertId };
  }

  async eliminar(id_metas) {
    const sql = `DELETE FROM ${this.table} WHERE id_metas = ?`;
    await this.db.query(sql, [id_metas]);
    return { deleted: true };
  }

  async actualizar(id_metas, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      const col = key === "descripcion" ? "descripción" : key;
      updates.push(`${col} = ?`);
      values.push(value);
    }
    values.push(id_metas);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_metas = ?`;
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE fecha_fin >= CURDATE()`;
    return await this.db.query(sql);
  }

  async consultarID(id_metas) {
    const sql = `SELECT * FROM ${this.table} WHERE id_metas = ?`;
    const rows = await this.db.query(sql, [id_metas]);
    return rows[0] || null;
  }

  async buscarPorAtributos(atributos) {
    const conditions = [],
      values = [];
    for (const [key, value] of Object.entries(atributos)) {
      const col = key === "descripcion" ? "descripción" : key;
      conditions.push(`${col} = ?`);
      values.push(value);
    }
    const sql = `SELECT * FROM ${this.table} ${
      conditions.length ? "WHERE " + conditions.join(" AND ") : ""
    }`;
    return await this.db.query(sql, values);
  }
}

module.exports = Meta;
