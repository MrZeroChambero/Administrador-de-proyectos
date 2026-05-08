class PersonasModel {
  constructor(db) {
    this.db = db;
    this.table = "personas";
  }

  async crear(persona) {
    const {
      id_persona,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      foto,
      dni,
      correo1,
      correo2,
      tlf1,
      tlf2,
      estado_persona,
    } = persona;
    const sql = `INSERT INTO ${this.table} 
      (id_persona, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, foto, dni, correo1, correo2, tlf1, tlf2, estado_persona) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await this.db.query(sql, [
      id_persona,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      foto,
      dni,
      correo1,
      correo2,
      tlf1,
      tlf2,
      estado_persona,
    ]);
    return { id_persona };
  }

  async eliminar(id_persona) {
    const sql = `DELETE FROM ${this.table} WHERE id_persona = ?`;
    await this.db.query(sql, [id_persona]);
    return { deleted: true };
  }

  async actualizar(id_persona, campos) {
    const updates = [];
    const values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_persona);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_persona = ?`;
    await this.db.query(sql, values);
    return { updated: true };
  }

  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  // Personas activas (estado_persona = 'activo')
  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE estado_persona = 'activo'`;
    return await this.db.query(sql);
  }

  async consultarID(id_persona) {
    const sql = `SELECT * FROM ${this.table} WHERE id_persona = ?`;
    const rows = await this.db.query(sql, [id_persona]);
    return rows[0] || null;
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
    return await this.db.query(sql, values);
  }
}

module.exports = PersonasModel;
