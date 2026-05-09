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
    if (result.affectedRows === 0) {
      return { id_persona: null, evento: false };
    }
    return { id_persona: result.insertId, evento: true };
  }

  async eliminar(id_persona) {
    const sql = `DELETE FROM ${this.table} WHERE id_persona = ?`;
    const resultado = await this.db.query(sql, [id_persona]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
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

  // Personas activas (estado_persona = 'activo')
  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE estado_persona = 'activo'`;
    const resultado = await this.db.query(sql);
    if (!resultado) {
      return { evento: false };
    }
    return { evento: true, data: resultado };
  }

  async consultarID(id_persona) {
    const sql = `SELECT * FROM ${this.table} WHERE id_persona = ?`;
    const resultado = await this.db.query(sql, [id_persona]);
    if (resultado.length === 0) {
      return { evento: true, data: null };
    }
    return { evento: true, data: resultado[0] };
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

module.exports = PersonasModel;
