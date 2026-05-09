class Validador {
  /**
   * Valida un objeto de datos contra un esquema de validación.
   * @param {Object} datos - Los datos a validar (ej. req.body)
   * @param {Object} esquema - Define reglas para cada campo.
   * @returns {Object} { evento: boolean, mensaje?: Object }
   */
  static validar(datos, esquema) {
    const errores = {};

    for (const [campo, reglas] of Object.entries(esquema)) {
      const valor = datos[campo];

      // 1. Validar obligatoriedad
      if (
        reglas.obligatorio &&
        (valor === undefined || valor === null || valor === "")
      ) {
        errores[campo] = `El campo '${campo}' es obligatorio.`;
        continue;
      }

      // Si no es obligatorio y el valor no está presente, saltamos validaciones
      if (
        !reglas.obligatorio &&
        (valor === undefined || valor === null || valor === "")
      ) {
        continue;
      }

      // 2. Validar tipo de dato
      if (reglas.tipo && typeof valor !== reglas.tipo) {
        errores[campo] = `Debe ser de tipo '${reglas.tipo}'.`;
        continue;
      }

      // 3. Validar caracteres especiales (solo para strings)
      if (reglas.sinCaracteresEspeciales && typeof valor === "string") {
        if (!this.validarCaracteresSeguros(valor)) {
          errores[
            campo
          ] = `Contiene caracteres no permitidos. Solo se permiten letras (incluyendo acentos), números, espacios, guiones, puntos y comas.`;
          continue;
        }
      }

      // 4. Validar longitud mínima y máxima (para strings)
      if (typeof valor === "string") {
        if (reglas.minLength !== undefined && valor.length < reglas.minLength) {
          errores[
            campo
          ] = `Debe tener al menos ${reglas.minLength} caracteres.`;
          continue;
        }
        if (reglas.maxLength !== undefined && valor.length > reglas.maxLength) {
          errores[
            campo
          ] = `Debe tener como máximo ${reglas.maxLength} caracteres.`;
          continue;
        }
      }

      // 5. Validar rango numérico
      if (typeof valor === "number") {
        if (reglas.min !== undefined && valor < reglas.min) {
          errores[campo] = `Debe ser mayor o igual a ${reglas.min}.`;
          continue;
        }
        if (reglas.max !== undefined && valor > reglas.max) {
          errores[campo] = `Debe ser menor o igual a ${reglas.max}.`;
          continue;
        }
      }

      // 6. Validar valores permitidos (enum)
      if (reglas.enum && !reglas.enum.includes(valor)) {
        errores[
          campo
        ] = `Debe ser uno de los siguientes valores: ${reglas.enum.join(
          ", "
        )}.`;
        continue;
      }

      // 7. Validar formato de fecha (YYYY-MM-DD)
      if (reglas.fecha && typeof valor === "string") {
        if (!this.validarFecha(valor)) {
          errores[
            campo
          ] = `Formato de fecha inválido. Use YYYY-MM-DD (ej. 2025-12-31).`;
          continue;
        }
      }

      // 8. Validar formato de email
      if (reglas.email && typeof valor === "string") {
        if (!this.validarEmail(valor)) {
          errores[
            campo
          ] = `Debe ser una dirección de correo electrónico válida.`;
          continue;
        }
      }

      // 9. Validar ID numérico o UUID (usando el método específico)
      if (reglas.validarId) {
        const tipoId = reglas.tipoId || "uuid"; // 'integer' o 'uuid'
        const resultadoId = this.validarId(valor, tipoId);
        if (!resultadoId.evento) {
          errores[campo] = resultadoId.mensaje;
          continue;
        }
      }
    }

    if (Object.keys(errores).length > 0) {
      return { evento: false, mensaje: errores };
    }
    return { evento: true };
  }

  /**
   * Comprueba que un string no contenga caracteres peligrosos o no deseados.
   * Permite: letras (mayúsculas/minúsculas con acentos), números, espacios,
   * guiones (-), puntos (.), comas (,) y la letra ñ/Ñ.
   * @param {string} texto
   * @returns {boolean}
   */
  static validarCaracteresSeguros(texto) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9\-\.,]+$/;
    return regex.test(texto);
  }

  /**
   * Valida formato de fecha YYYY-MM-DD, y que sea una fecha real (no 2025-13-40).
   * @param {string} fechaStr
   * @returns {boolean}
   */
  static validarFecha(fechaStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fechaStr)) return false;
    const [year, month, day] = fechaStr.split("-").map(Number);
    const fecha = new Date(year, month - 1, day);
    return (
      fecha.getFullYear() === year &&
      fecha.getMonth() === month - 1 &&
      fecha.getDate() === day
    );
  }

  /**
   * Valida formato básico de email.
   * @param {string} email
   * @returns {boolean}
   */
  static validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida que un ID sea obligatorio y tenga el formato correcto (entero positivo o UUID).
   * @param {*} id - El ID a validar
   * @param {string} tipoId - 'integer' o 'uuid'
   * @returns {Object} { evento: boolean, mensaje?: string }
   */
  static validarId(id, tipoId = "uuid") {
    // 1. Obligatorio
    if (id === undefined || id === null || id === "") {
      return { evento: false, mensaje: "El ID es obligatorio." };
    }

    // 2. Validar según tipo
    if (tipoId === "integer") {
      if (!Number.isInteger(id) && !/^\d+$/.test(id)) {
        return {
          evento: false,
          mensaje: "El ID debe ser un número entero positivo.",
        };
      }
      const num = Number(id);
      if (num <= 0) {
        return {
          evento: false,
          mensaje: "El ID debe ser un número entero positivo mayor a cero.",
        };
      }
      return { evento: true };
    } else if (tipoId === "uuid") {
      // UUID versión 4 (estándar)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return {
          evento: false,
          mensaje:
            "El ID debe ser un UUID válido (ej: 123e4567-e89b-12d3-a456-426614174000).",
        };
      }
      return { evento: true };
    } else {
      return {
        evento: false,
        mensaje: `Tipo de ID '${tipoId}' no soportado. Use 'integer' o 'uuid'.`,
      };
    }
  }

  /**
   * Genera un esquema de validación para un campo ID (para usar dentro de Validador.validar).
   * @param {string} tipoId - 'integer' o 'uuid'
   * @param {boolean} obligatorio - por defecto true
   * @returns {Object} esquema para el campo ID
   */
  static esquemaId(tipoId = "uuid", obligatorio = true) {
    const esquema = {
      obligatorio: obligatorio,
      validarId: true,
      tipoId: tipoId,
    };
    if (tipoId === "integer") {
      esquema.tipo = "number";
    } else {
      esquema.tipo = "string";
    }
    return esquema;
  }

  /**
   * Limpia los campos de un objeto o array, dejando solo los permitidos.
   * @param {Object|Array} data - Datos a limpiar
   * @param {Array} permitirCampos - Lista de campos que se conservan
   * @returns {Object|Array} Datos filtrados
   */
  static LimpiarCampos(data, permitirCampos) {
    if (Array.isArray(data)) {
      return data.map((item) => this.LimpiarCampos(item, permitirCampos));
    }
    const limpios = {};
    for (const campo of permitirCampos) {
      if (data.hasOwnProperty(campo)) {
        limpios[campo] = data[campo];
      }
    }
    return limpios;
  }

  /**
   * Limpia y sanitiza los datos para enviar como JSON seguro.
   * - Restringe a los campos permitidos.
   * - Escapa caracteres HTML en campos de texto especificados.
   * @param {Object|Array} data - Datos crudos (pueden venir de la BD)
   * @param {Array} allowedFields - Lista de campos permitidos en la respuesta
   * @param {Array} fieldsToEscape - Lista de campos que contienen texto a escapar (HTML)
   * @returns {Object|Array} Datos limpios y seguros
   */
  static sanitizarSalida(data, allowedFields = [], fieldsToEscape = []) {
    // 1. Limpiar campos (restringir solo a los permitidos)
    let limpio = this.LimpiarCampos(data, allowedFields);

    // 2. Función auxiliar para escapar HTML en un string
    const escapeHtml = (str) => {
      if (typeof str !== "string") return str;
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    // 3. Aplicar escape recursivo sobre los campos especificados
    const aplicarEscape = (obj) => {
      if (!obj || typeof obj !== "object") return obj;
      if (Array.isArray(obj)) {
        return obj.map((item) => aplicarEscape(item));
      }
      const result = { ...obj };
      for (const campo of fieldsToEscape) {
        if (result.hasOwnProperty(campo) && typeof result[campo] === "string") {
          result[campo] = escapeHtml(result[campo]);
        }
      }
      return result;
    };

    return aplicarEscape(limpio);
  }
}

module.exports = Validador;
