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

      // 8. Validar formato de email (opcional si se requiere)
      if (reglas.email && typeof valor === "string") {
        if (!this.validarEmail(valor)) {
          errores[
            campo
          ] = `Debe ser una dirección de correo electrónico válida.`;
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
}

module.exports = Validador;
