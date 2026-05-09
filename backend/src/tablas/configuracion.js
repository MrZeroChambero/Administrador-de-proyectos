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
    if (result.affectedRows === 0) {
      return { id_configuracion: null, evento: false };
    }
    return { id_configuracion: result.insertId, evento: true };
  }

  async eliminar(id_configuracion) {
    const sql = `DELETE FROM ${this.table} WHERE id_configuracion = ?`;
    const resultado = await this.db.query(sql, [id_configuracion]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
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

  // No tiene campo de estado, retorna todos
  async consultarActivos() {
    return await this.consultarTodos();
  }

  async consultarID(id_configuracion) {
    const sql = `SELECT * FROM ${this.table} WHERE id_configuracion = ?`;
    const resultado = await this.db.query(sql, [id_configuracion]);
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

module.exports = Configuracion;
