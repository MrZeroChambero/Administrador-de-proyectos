class Habilidad {
  constructor(db) {
    this.db = db;
    this.table = "habilidades";
  }

  async crear(datos) {
    const { nombre_habilidad, descripcion_habilidad, estado_habilidad } = datos;
    const sql = `INSERT INTO ${this.table} 
      (nombre_habilidad, descripcion_habilidad, estado_habilidad) 
      VALUES (?, ?, ?)`;
    const result = await this.db.query(sql, [
      nombre_habilidad,
      descripcion_habilidad,
      estado_habilidad,
    ]);
    return { id_habilidad: result.insertId };
  }

  async eliminar(id_habilidad) {
    const sql = `DELETE FROM ${this.table} WHERE id_habilidad = ?`;
    await this.db.query(sql, [id_habilidad]);
    return { deleted: true };
  }

  async actualizar(id_habilidad, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_habilidad);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_habilidad = ?`;
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE estado_habilidad = 'activo'`;
    return await this.db.query(sql);
  }

  async consultarID(id_habilidad) {
    const sql = `SELECT * FROM ${this.table} WHERE id_habilidad = ?`;
    const rows = await this.db.query(sql, [id_habilidad]);
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

module.exports = Habilidad;
