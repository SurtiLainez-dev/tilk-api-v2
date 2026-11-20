import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotaCreditoModalidad {
  SALDO_FAVOR = 'SALDO_FAVOR',
  CUENTA = 'CUENTA',
}
export enum NotaCreditoOrigen {
  CAJA = 'CAJA',
  CONTABILIDAD = 'CONTABILIDAD',
  LEGACY = 'LEGACY',
}

export enum NotaCreditoUso {
  GENERAL = 'GENERAL',
  PAGO_DXC = 'PAGO_DXC',
}

@Entity({ name: 'nota_credito_clientes' })
@Index('uq_ncc_slug', ['slug'], { unique: true })
@Index('uq_ncc_codigo', ['codigo'], { unique: true })
@Index(
    'uq_ncc_cliente_contador',
    ['cliente_id', 'contador'],
    { unique: true },
)
@Index(
    'uq_ncc_anticipo',
    ['anticipo_cliente_id'],
    { unique: true },
)
@Index('idx_ncc_creditos_disponibles', [
  'cliente_id',
  'modalidad',
  'uso',
  'estado',
])
@Index('idx_ncc_fecha_vencimiento', ['fecha_vencimiento'])
@Index('idx_ncc_origen', ['origen'])
export class NotaCreditoClientes {

  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
    unsigned: true,
  })
  id!: string;

  @Column({
    name: 'slug',
    type: 'char',
    length: 36,
    nullable: true,
    default: null,
  })
  slug!: string | null;

  @Column({
    name: 'codigo',
    type: 'varchar',
    length: 30,
    nullable: true,
    default: null,
  })
  codigo!: string | null;

  @Column({
    name: 'contador',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  contador!: number | null;

  @Column({
    name: 'cliente_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
    default: null,
  })
  cliente_id!: string | null;

  @Column({
    name: 'anticipo_cliente_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
    default: null,
  })
  anticipo_cliente_id!: string | null;

  @Column({
    name: 'cc_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
    default: null,
  })
  cc_id!: string | null;

  @Column({
    name: 'monto',
    type: 'double',
    precision: 9,
    scale: 2,
  })
  monto!: number;

  @Column({
    name: 'saldo_disponible',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: '0.00',
  })
  saldo_disponible!: string;

  @Column({
    name: 'user_id',
    type: 'bigint',
    unsigned: true,
  })
  user_id!: string;

  @Column({
    name: 'ct_libro_diario_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  ct_libro_diario_id!: string | null;

  @Column({
    name: 'referencia',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: null,
  })
  referencia!: string | null;

  @Column({
    name: 'concepto',
    type: 'varchar',
    length: 150,
  })
  concepto!: string;

  @Column({
    name: 'motivo',
    type: 'varchar',
    length: 400,
    nullable: true,
    default: null,
  })
  motivo!: string | null;

  @Column({
    name: 'venta_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
    default: null,
  })
  venta_id!: string | null;

  @Column({
    name: 'tipo_nota_credito_id',
    type: 'bigint',
    unsigned: true,
  })
  tipo_nota_credito_id!: string;

  @Column({
    name: 'recibo_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  recibo_id!: string | null;

  @Column({
    name: 'recibo_id_2',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  recibo_id_2!: string | null;

  @Column({
    name: 'saldo_anterior',
    type: 'double',
    precision: 9,
    scale: 2,
    default: 0.00,
  })
  saldo_anterior!: number;

  @Column({
    name: 'saldo_nuevo',
    type: 'double',
    precision: 9,
    scale: 2,
    default: 0.00,
  })
  saldo_nuevo!: number;

  @Column({
    name: 'tipo',
    type: 'tinyint',
    default: 1,
  })
  tipo!: number;

  @Column({
    name: 'modalidad',
    type: 'enum',
    enum: NotaCreditoModalidad,
    nullable: true,
    default: null,
  })
  modalidad!: NotaCreditoModalidad | null;

  @Column({
    name: 'origen',
    type: 'enum',
    enum: NotaCreditoOrigen,
    default: NotaCreditoOrigen.LEGACY,
  })
  origen!: NotaCreditoOrigen;

  @Column({
    name: 'uso',
    type: 'enum',
    enum: NotaCreditoUso,
    nullable: true,
    default: null,
  })
  uso!: NotaCreditoUso | null;

  @Column({
    name: 'estado',
    type: 'tinyint',
    unsigned: true,
    default: 0,
  })
  estado!: number;

  @Column({
    name: 'url',
    type: 'varchar',
    length: 500,
    nullable: true,
    default: null,
  })
  url!: string | null;

  @Column({
    name: 'fecha_vencimiento',
    type: 'date',
    nullable: true,
    default: null,
  })
  fecha_vencimiento!: string | null;

  @Column({
    name: 'fecha_liquidacion',
    type: 'datetime',
    nullable: true,
    default: null,
  })
  fecha_liquidacion!: Date | null;

  @Column({
    name: 'fecha_anulacion',
    type: 'datetime',
    nullable: true,
    default: null,
  })
  fecha_anulacion!: Date | null;

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

  @Column({
    name: 'operacion_uuid',
    type: 'char',
    length: 36,
    nullable: true,
    default: null,
  })
  operacion_uuid!: string | null;

  @Column({
    name: 'operacion_hash',
    type: 'char',
    length: 64,
    nullable: true,
    default: null,
  })
  operacion_hash!: string | null;

  @Column({
    name: 'url_comprobante',
    type: 'varchar',
    length: 500,
    nullable: true,
    default: null,
  })
  url_comprobante!: string | null;

  @Column({
    name: 'user_anulacion_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  user_anulacion_id!: string | null;

  @Column({
    name: 'motivo_anulacion',
    type: 'varchar',
    length: 400,
    nullable: true,
  })
  motivo_anulacion!: string | null;
}