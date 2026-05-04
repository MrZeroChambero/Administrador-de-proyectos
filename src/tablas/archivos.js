class Archivos {
  constructor(db) {
    this.db = db;
    this.table = "archivos";
  }

  async crear(datos) {
    const { fk_meta, tipo_activo, nombre_archivo, ruta_archivo, extension } =
      datos;
    const sql = `INSERT INTO ${this.table} 
      (fk_meta, tipo_activo, nombre_archivo, ruta_archivo, extension) 
      VALUES (?, ?, ?, ?, ?)`;
    const result = await this.db.query(sql, [
      fk_meta,
      tipo_activo,
      nombre_archivo,
      ruta_archivo,
      extension,
    ]);
    return { id_archivo: result.insertId };
  }

  async eliminar(id_archivo) {
    const sql = `DELETE FROM ${this.table} WHERE id_archivo = ?`;
    await this.db.query(sql, [id_archivo]);
    return { deleted: true };
  }

  async actualizar(id_archivo, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_archivo);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_archivo = ?`;
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

  async consultarID(id_archivo) {
    const sql = `SELECT * FROM ${this.table} WHERE id_archivo = ?`;
    const rows = await this.db.query(sql, [id_archivo]);
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

module.exports = Archivos;
