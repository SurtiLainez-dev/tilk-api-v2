import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from 'typeorm';

export enum AnticipoGestionSaldo {
    LEGACY = 'LEGACY',
    NOTA_CREDITO = 'NOTA_CREDITO',
}

export enum AnticipoUso {
    GENERAL = 'GENERAL',
    PAGO_DXC = 'PAGO_DXC',
}

@Entity({ name: 'anticipo_clientes' })
@Index('idx_ac_gestion_saldo', ['gestion_saldo'])
@Index('idx_ac_cliente_uso_estado', [
    'cliente_id',
    'uso',
    'estado',
])
export class AnticipoClientes {

    @PrimaryGeneratedColumn({
        name: 'id',
        type: 'bigint',
        unsigned: true,
    })
    id!: string;

    @Column({
        name: 'slug',
        type: 'char',
        length: 36,
        nullable: true,
        unique: true,
    })
    slug!: string | null;

    @Column({
        name: 'cliente_id',
        type: 'bigint',
        unsigned: true,
    })
    cliente_id!: string;

    @Column({
        name: 'cc_id',
        type: 'bigint',
        unsigned: true,
    })
    cc_id!: string;

    @Column({
        name: 'motivo',
        type: 'varchar',
        length: 400,
    })
    motivo!: string;

    @Column({
        name: 'monto',
        type: 'double',
        precision: 9,
        scale: 2,
    })
    monto!: number;

    @Column({
        name: 'estado',
        type: 'tinyint',
        nullable: false,
    })
    estado!: number;

    @Column({
        name: 'archivo',
        type: 'varchar',
        length: 250,
        nullable: true,
    })
    archivo!: string | null;

    @Column({
        name: 'recibo_id',
        type: 'bigint',
        unsigned: true,
    })
    recibo_id!: string;

    @Column({
        name: 'gestion_saldo',
        type: 'enum',
        enum: AnticipoGestionSaldo,
        default: AnticipoGestionSaldo.LEGACY,
        comment: 'Sistema responsable de administrar el saldo del anticipo',
    })
    gestion_saldo!: AnticipoGestionSaldo;

    @Column({
        name: 'uso',
        type: 'enum',
        enum: AnticipoUso,
        nullable: true,
        default: null,
        comment: 'Destino autorizado del anticipo',
    })
    uso!: AnticipoUso | null;

    @Column({
        name: 'fecha_liquidacion',
        type: 'datetime',
        nullable: true,
        default: null,
        comment: 'Fecha en que se agoto el saldo del anticipo',
    })
    fecha_liquidacion!: Date | null;

    @Column({
        name: 'created_at',
        type: 'timestamp',
        nullable: true,
    })
    created_at!: Date | null;

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        nullable: true,
    })
    updated_at!: Date | null;
}