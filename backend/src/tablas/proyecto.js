class ProyectoModel {
  constructor(db) {
    this.db = db; // instancia de Database
    this.table = "proyecto";
  }

  // Crear un nuevo proyecto
  async crear(proyecto) {
    const {
      id_proyecto,
      nombre,
      descripcion,
      estado_proyecto,
      progreso,
      icono_proyecto,
      fecha_inicio,
      fecha_fin,
    } = proyecto;
    const sql = `INSERT INTO ${this.table} 
      (id_proyecto, nombre, descripcion, estado_proyecto, progreso, icono_proyecto, fecha_inicio, fecha_fin) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const resultado = await this.db.query(sql, [
      id_proyecto,
      nombre,
      descripcion,
      estado_proyecto,
      progreso,
      icono_proyecto,
      fecha_inicio,
      fecha_fin,
    ]);
    if (resultado.affectedRows === 0) {
      return { id_proyecto: null, evento: false };
    }
    return { id_proyecto: resultado.insertId, evento: true };
  }

  // Eliminar proyecto por su ID
  async eliminar(id_proyecto) {
    const sql = `DELETE FROM ${this.table} WHERE id_proyecto = ?`;
    await this.db.query(sql, [id_proyecto]);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
  }

  // Actualizar proyecto (solo campos enviados)
  async actualizar(id_proyecto, campos) {
    const updates = [];
    const values = [];
    for (const [key, value] of Object.entries(campos)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id_proyecto);
    const sql = `UPDATE ${this.table} SET ${updates.join(
      ", "
    )} WHERE id_proyecto = ?`;
    const resultado = await this.db.query(sql, values);
    if (resultado.affectedRows === 0) {
      return { evento: false };
    }
    return { evento: true };
  }

  // Consultar todos los proyectos
  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    const resultado = await this.db.query(sql);
    if (!resultado) {
      return { evento: false };
    }
    return { evento: true, data: resultado };
  }
  º;

  // Consultar proyectos activos (estado 'en espera' o 'en progreso')
  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE estado_proyecto IN ('en espera', 'en progreso')`;
    const resultado = await this.db.query(sql);
    if (!resultado) {
      return { evento: false };
    }
    return { evento: true, data: resultado };
  }

  // Consultar proyecto por ID
  async consultarID(id_proyecto) {
    const sql = `SELECT * FROM ${this.table} WHERE id_proyecto = ?`;
    const resultado = await this.db.query(sql, [id_proyecto]);
    if (resultado.length === 0) {
      return { evento: true, data: null };
    }
    return { evento: true, data: resultado[0] || null };
  }

  // Búsqueda por atributos (ej: { nombre: 'API', estado_proyecto: 'en progreso' })
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
    if (!resultado) {
      return { evento: false };
    }
    return { evento: true, data: resultado };
  }
}

module.exports = ProyectoModel;
