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
    if (result.affectedRows === 0) {
      return { id_metas: null, evento: false };
    }
    return { id_metas: result.insertId, evento: true };
  }

  async eliminar(id_metas) {
    const sql = `DELETE FROM ${this.table} WHERE id_metas = ?`;
    await this.db.query(sql, [id_metas]);
    if (result.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
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
    const sql = `SELECT * FROM ${this.table} WHERE fecha_fin >= CURDATE()`;
    const resultado = await this.db.query(sql);
    if (!resultado) {
      return { evento: false };
    }
    return { evento: true, data: resultado };
  }

  async consultarID(id_metas) {
    const sql = `SELECT * FROM ${this.table} WHERE id_metas = ?`;
    const resultado = await this.db.query(sql, [id_metas]);
    if (resultado.length === 0) {
      return { evento: true, data: null };
    }
    return { evento: true, data: resultado[0] };
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
    const resultado = await this.db.query(sql, values);
    if (resultado.length === 0) {
      return { evento: true, data: [] };
    }
    return { evento: true, data: resultado };
  }
}

module.exports = Meta;
