// Configuración del formulario.
export const CONFIG = {
  // Enlace del calendario de reserva (se muestra a facturación de 300.000 € o más).
  calendarUrl: "https://calendar.app.google/47jtTfYvtLpyD5vt8",
  // Enlace de la lista de espera de la membresía. Pendiente: mientras esté vacío, el botón está desactivado.
  waitlistUrl: "",
  membershipName: "membresía Climbuu",
  // Facturaciones que reciben el calendario.
  qualifies: ["300-1m", "gt1m"] as const,
};
