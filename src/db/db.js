// database.js
const mysql = require("mysql2/promise");
require("dotenv").config({ path: "../../.env" });

class Database {
  constructor() {
    this.host = process.env.DB_HOST || "localhost";
    this.user = process.env.DB_USER || "root";
    this.password = process.env.DB_PASSWORD || "";
    this.database = process.env.DB_NAME || "proyectos";
    this.port = process.env.DB_PORT || 3306;
    this.connection = null;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        host: this.host,
        user: this.user,
        password: this.password,
        database: this.database,
        port: this.port,
      });
    }
    return this.connection;
  }

  async getConnection() {
    if (!this.connection) {
      await this.connect();
    }
    return this.connection;
  }

  async query(sql, params = []) {
    const conn = await this.getConnection();
    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}

module.exports = Database;
