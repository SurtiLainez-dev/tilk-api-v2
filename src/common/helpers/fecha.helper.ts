export const ZONA_HORARIA_HONDURAS = 'America/Tegucigalpa';

const formateador = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_HONDURAS,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
});

export function fechaHonduras(ahora: Date = new Date()) {
    const partes = formateador.formatToParts(ahora);
    const obtener = (tipo: Intl.DateTimeFormatPartTypes): string => partes.find(parte => parte.type === tipo)?.value ?? '';

    const fecha = `${obtener('year')}-${obtener('month')}-${obtener('day')}`;
    const hora = `${obtener('hour')}:${obtener('minute')}:${obtener('second')}`;
    const fechaHora = `${fecha} ${hora}`;

    return {
        fecha,
        hora,
        fecha_hora: ahora.toISOString(),
        fecha_hora_mysql: fechaHora,
        zona_horaria: ZONA_HORARIA_HONDURAS,
        created_at: fechaHora,
        updated_at: fechaHora,
    };
}