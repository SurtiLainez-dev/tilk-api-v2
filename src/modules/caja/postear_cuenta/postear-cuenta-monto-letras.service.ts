
import { BadRequestException, Injectable } from '@nestjs/common';
import writtenNumber = require('written-number');

@Injectable()
export class PostearCuentaMontoLetrasService {
    convertir(monto: number | string): string {
        const valor = Number(monto);
        if (!Number.isFinite(valor) || valor < 0) throw new BadRequestException('El monto no es válido.');

        const centavosTotales = Math.round(valor * 100);
        if (!Number.isSafeInteger(centavosTotales) || Math.abs(valor * 100 - centavosTotales) > 0.000001) {
            throw new BadRequestException('El monto debe tener como máximo dos decimales.');
        }

        const enteros = Math.floor(centavosTotales / 100);
        const centavos = centavosTotales % 100;
        const letras = writtenNumber(enteros, { lang: 'es' }).toUpperCase();
        const letrasCentavos = writtenNumber(centavos, { lang: 'es' }).toUpperCase();
        const moneda = enteros === 1 ? 'LEMPIRA' : 'LEMPIRAS';
        const monedaCentavos = centavos === 1 ? 'CENTAVO' : 'CENTAVOS';
        const resultado = `${letras} ${moneda} CON ${letrasCentavos} ${monedaCentavos}`;

        if (resultado.length > 150) throw new BadRequestException('El monto en letras supera los 150 caracteres permitidos.');
        return resultado;
    }
}
