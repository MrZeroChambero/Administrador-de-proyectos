class PersonaHabilidad {
  constructor(db) {
    this.db = db;
    this.table = "persona_habilidad";
  }

  async crear(datos) {
    const { fk_persona, fk_habilidad } = datos;
    const sql = `INSERT INTO ${this.table} (fk_persona, fk_habilidad) VALUES (?, ?)`;
    const result = await this.db.query(sql, [fk_persona, fk_habilidad]);
    return { id_persona_habilidad: result.insertId };
  }

  async eliminar(id_persona_habilidad) {
    const sql = `DELETE FROM ${this.table} WHERE id_persona_habilidad = ?`;
    await this.db.query(sql, [id_persona_habilidad]);
    return { deleted: true };
  }

  async actualizar(id_persona_habilidad, campos) {
    const updates = [],
      values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_persona_habilidad);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_persona_habilidad = ?`;
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

  async consultarID(id_persona_habilidad) {
    const sql = `SELECT * FROM ${this.table} WHERE id_persona_habilidad = ?`;
    const rows = await this.db.query(sql, [id_persona_habilidad]);
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

module.exports = PersonaHabilidad;
