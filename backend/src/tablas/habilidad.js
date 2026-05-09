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
    const resultado = await this.db.query(sql, [
      nombre_habilidad,
      descripcion_habilidad,
      estado_habilidad,
    ]);
    if (resultado.affectedRows === 0) {
      return { id_habilidad: null, evento: false };
    }

    return { id_habilidad: resultado.insertId, evento: true };
  }

  async eliminar(id_habilidad) {
    const sql = `DELETE FROM ${this.table} WHERE id_habilidad = ?`;
    const resultado = await this.db.query(sql, [id_habilidad]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
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
    if (updates.length === 0) {
      return { evento: false };
    }
    return { evento: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    const resultado = await this.db.query(sql);
    if (!sql) {
      return { evento: false };
    }
    return { evento: true, data: await this.db.query(sql) };
  }

  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE estado_habilidad = 'activo'`;
    return { evento: true, data: await this.db.query(sql) };
  }

  async consultarID(id_habilidad) {
    const sql = `SELECT * FROM ${this.table} WHERE id_habilidad = ?`;
    const resultado = await this.db.query(sql, [id_habilidad]);
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

module.exports = Habilidad;
