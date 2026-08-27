/* ============================================================
   password — política de contraseñas del panel

   Espejo EXACTO de la del backend
   (`src/auth/common/validators/password.decorator.ts`) y de la de la app
   móvil (`utils/password.ts`). El servidor es la autoridad: esto solo sirve
   para avisar antes de enviar y para generar credenciales que el API acepte.

   Antes el panel validaba 6 caracteres sin complejidad y generaba las
   contraseñas temporales con un alfabeto SIN símbolos, así que el backend
   rechazaba con un 400 el 100% de las altas de personal y de administradores.
============================================================ */

export const PASSWORD_MIN_LENGTH = 7;

/** bcrypt ignora lo que pase de 72 bytes; el backend aplica el mismo tope. */
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/;

/** `true` si la contraseña cumple la política del backend. */
export const isStrongPassword = (value: string): boolean =>
  value.length <= PASSWORD_MAX_LENGTH && PASSWORD_REGEX.test(value);

/* Alfabetos sin caracteres ambiguos (0/O, 1/l/I): estas contraseñas se dictan
   por teléfono o se copian a mano de la tarjeta de credenciales. */
const MINUSCULAS = "abcdefghijkmnopqrstuvwxyz";
const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITOS = "23456789";
const SIMBOLOS = "!@#$%*+-=?";
const TODOS = MINUSCULAS + MAYUSCULAS + DIGITOS + SIMBOLOS;

/** Índice aleatorio criptográfico sin sesgo por módulo. */
function elegir(abc: string): string {
  const limite = Math.floor(0xffffffff / abc.length) * abc.length;
  const buf = new Uint32Array(1);
  let n: number;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limite);
  return abc[n % abc.length];
}

/**
 * Contraseña temporal legible que SIEMPRE cumple la política.
 *
 * Se siembra una de cada clase obligatoria antes de rellenar, porque dejarlo
 * al azar sobre un alfabeto mezclado no garantiza el símbolo: ese era
 * exactamente el fallo anterior.
 */
export function generarPassword(largo = 12): string {
  const total = Math.max(largo, PASSWORD_MIN_LENGTH);
  const chars = [
    elegir(MINUSCULAS),
    elegir(MAYUSCULAS),
    elegir(DIGITOS),
    elegir(SIMBOLOS),
  ];
  while (chars.length < total) chars.push(elegir(TODOS));

  /* Barajado de Fisher-Yates: sin él las cuatro primeras posiciones
     delatarían siempre el mismo patrón minúscula-mayúscula-dígito-símbolo. */
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
