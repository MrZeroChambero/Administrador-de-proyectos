class Informacion {
  constructor(db) {
    this.db = db;
    this.table = "informacion";
  }

  async crear(datos) {
    const {
      fk_proyecto,
      tipo_informacion,
      nombre_informacion,
      estado_informacion,
    } = datos;
    const sql = `INSERT INTO ${this.table} 
      (fk_proyecto, tipo_informacion, nombre_informacion, estado_informacion) 
      VALUES (?, ?, ?, ?)`;
    const result = await this.db.query(sql, [
      fk_proyecto,
      tipo_informacion,
      nombre_informacion,
      estado_informacion,
    ]);
    return { id_informacion: result.insertId };
  }

  async eliminar(id_informacion) {
    const sql = `DELETE FROM ${this.table} WHERE id_informacion = ?`;
    await this.db.query(sql, [id_informacion]);
    return { deleted: true };
  }

  async actualizar(id_informacion, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_informacion);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_informacion = ?`;
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE estado_informacion IN ('en espera', 'en progreso')`;
    return await this.db.query(sql);
  }

  async consultarID(id_informacion) {
    const sql = `SELECT * FROM ${this.table} WHERE id_informacion = ?`;
    const rows = await this.db.query(sql, [id_informacion]);
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

module.exports = Informacion;
