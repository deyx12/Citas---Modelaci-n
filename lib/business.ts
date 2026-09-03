export function createAppointmentCode(date: Date, sequence: number) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const suffix = String(sequence).padStart(3, "0");

  return `BEL-${year}${month}${day}-${suffix}`;
}

export function isFutureAppointment(date: Date, now = new Date()) {
  return date.getTime() > now.getTime();
}
