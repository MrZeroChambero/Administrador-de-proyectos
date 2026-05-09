class ProyectoPersonaModel {
  constructor(db) {
    this.db = db;
    this.table = "proyecto_persona";
  }

  async crear(relacion) {
    const { fk_persona, fk_proyecto, prosito } = relacion;
    const sql = `INSERT INTO ${this.table} (fk_persona, fk_proyecto, prosito) VALUES (?, ?, ?)`;
    const resultado = await this.db.query(sql, [
      fk_persona,
      fk_proyecto,
      prosito,
    ]);
    if (resultado.affectedRows === 0) {
      return { id_proyecto_persona: null, evento: false };
    }
    return { id_proyecto_persona: resultado.insertId, evento: true };
  }

  async eliminar(id_proyecto_persona) {
    const sql = `DELETE FROM ${this.table} WHERE id_proyecto_persona = ?`;
    const resultado = await this.db.query(sql, [id_proyecto_persona]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
  }

  async actualizar(id_proyecto_persona, campos) {
    const updates = [];
    const values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_proyecto_persona);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_proyecto_persona = ?`;
    await this.db.query(sql, values);
    if (updates.length === 0) {
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

  // Relaciones activas: la persona debe estar activa y el proyecto activo (en espera o en progreso)
  async consultarActivos() {
    const sql = `
      SELECT pp.* 
      FROM ${this.table} pp
      JOIN personas p ON pp.fk_persona = p.id_persona
      JOIN proyecto pr ON pp.fk_proyecto = pr.id_proyecto
      WHERE p.estado_persona = 'activo' 
        AND pr.estado_proyecto IN ('en espera', 'en progreso')
    `;
    const resultado = await this.db.query(sql);
    if (!resultado) {
      return { evento: false };
    }
    return { evento: true, data: resultado };
  }

  async consultarID(id_proyecto_persona) {
    const sql = `SELECT * FROM ${this.table} WHERE id_proyecto_persona = ?`;
    const resultado = await this.db.query(sql, [id_proyecto_persona]);
    if (resultado.length === 0) {
      return { evento: true, data: null };
    }
    return { evento: true, data: resultado[0] || null };
  }

  async buscarPorAtributos(atributos) {
    const conditions = [];
    const values = [];
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

module.exports = ProyectoPersonaModel;
