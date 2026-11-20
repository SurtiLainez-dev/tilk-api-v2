
declare module 'written-number' {
    interface WrittenNumberOptions {
        lang?: string;
    }

    function writtenNumber(numero: number, opciones?: WrittenNumberOptions): string;
    export = writtenNumber;
}
