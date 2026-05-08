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
    await this.db.query(sql, [
      id_proyecto,
      nombre,
      descripcion,
      estado_proyecto,
      progreso,
      icono_proyecto,
      fecha_inicio,
      fecha_fin,
    ]);
    return { id_proyecto };
  }

  // Eliminar proyecto por su ID
  async eliminar(id_proyecto) {
    const sql = `DELETE FROM ${this.table} WHERE id_proyecto = ?`;
    await this.db.query(sql, [id_proyecto]);
    return { deleted: true };
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
    await this.db.query(sql, values);
    return { updated: true };
  }

  // Consultar todos los proyectos
  async consultarTodos() {
    const sql = `SELECT * FROM ${this.table}`;
    return await this.db.query(sql);
  }

  // Consultar proyectos activos (estado 'en espera' o 'en progreso')
  async consultarActivos() {
    const sql = `SELECT * FROM ${this.table} WHERE estado_proyecto IN ('en espera', 'en progreso')`;
    return await this.db.query(sql);
  }

  // Consultar proyecto por ID
  async consultarID(id_proyecto) {
    const sql = `SELECT * FROM ${this.table} WHERE id_proyecto = ?`;
    const rows = await this.db.query(sql, [id_proyecto]);
    return rows[0] || null;
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
    return await this.db.query(sql, values);
  }
}

module.exports = ProyectoModel;
