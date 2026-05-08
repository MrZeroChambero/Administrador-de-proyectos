class Configuracion {
  constructor(db) {
    this.db = db;
    this.table = "configuracion";
  }

  async crear(datos) {
    const { fk_usuario, letra_tamano, letra_color, fk_tema } = datos;
    const sql = `INSERT INTO ${this.table} 
      (fk_usuario, letra_tamano, letra_color, fk_tema) 
      VALUES (?, ?, ?, ?)`;
    const result = await this.db.query(sql, [
      fk_usuario,
      letra_tamano,
      letra_color,
      fk_tema,
    ]);
    return { id_configuracion: result.insertId };
  }

  async eliminar(id_configuracion) {
    const sql = `DELETE FROM ${this.table} WHERE id_configuracion = ?`;
    await this.db.query(sql, [id_configuracion]);
    return { deleted: true };
  }

  async actualizar(id_configuracion, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_configuracion);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_configuracion = ?`;
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  // No tiene campo de estado, retorna todos
  async consultarActivos() {
    return await this.consultarTodos();
  }

  async consultarID(id_configuracion) {
    const sql = `SELECT * FROM ${this.table} WHERE id_configuracion = ?`;
    const rows = await this.db.query(sql, [id_configuracion]);
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

module.exports = Configuracion;
