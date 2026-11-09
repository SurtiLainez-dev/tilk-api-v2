import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tk2_precio_planes' })
export class Tk2PrecioPlanesEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'tk2_precio_id', type: 'bigint', unsigned: true })
  tk2_precio_id!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ name: 'tipo_venta', type: 'enum', enum: ['CONTADO', 'CONTADO_CUOTAS', 'CREDITO', 'OFERTA', 'ONLINE'], default: 'CONTADO' })
  tipo_venta!: 'CONTADO' | 'CONTADO_CUOTAS' | 'CREDITO' | 'OFERTA' | 'ONLINE';

  @Column({ name: 'tipo_calculo', type: 'enum', enum: ['FIJO', 'PORCENTAJE_CONTADO', 'SIN_INTERES', 'INTERES_SIMPLE', 'INTERES_COMPUESTO', 'CUOTA_NIVELADA', 'PROMOCION_CONTADO'], default: 'FIJO' })
  tipo_calculo!: 'FIJO' | 'PORCENTAJE_CONTADO' | 'SIN_INTERES' | 'INTERES_SIMPLE' | 'INTERES_COMPUESTO' | 'CUOTA_NIVELADA' | 'PROMOCION_CONTADO';

  @Column({ name: 'necesario_sdc', type: 'tinyint', default: 1 })
  necesario_sdc!: number;

  @Column({ name: 'aplica_tipo_cliente', type: 'enum', enum: ['TODOS', 'NORMAL', 'BUEN_CLIENTE', 'VIP', 'MAYOREO'], default: 'TODOS' })
  aplica_tipo_cliente!: 'TODOS' | 'NORMAL' | 'BUEN_CLIENTE' | 'VIP' | 'MAYOREO';

  @Column({ name: 'precio_final', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  precio_final!: string;

  @Column({ name: 'porcentaje_precio_contado', type: 'decimal', precision: 8, scale: 2, default: 0.00 })
  porcentaje_precio_contado!: string;

  @Column({ name: 'descuento_monto', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  descuento_monto!: string;

  @Column({ name: 'descuento_porcentaje', type: 'decimal', precision: 8, scale: 2, default: 0.00 })
  descuento_porcentaje!: string;

  @Column({ name: 'plazo_meses', type: 'int', default: 0 })
  plazo_meses!: number;

  @Column({ name: 'cantidad_cuotas', type: 'int', default: 0 })
  cantidad_cuotas!: number;

  @Column({ name: 'maximo_cuotas', type: 'int', default: 0 })
  maximo_cuotas!: number;

  @Column({ name: 'cuota', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  cuota!: string;

  @Column({ name: 'requiere_prima', type: 'tinyint', default: 0 })
  requiere_prima!: number;

  @Column({ name: 'modo_prima', type: 'enum', enum: ['MONTO', 'PORCENTAJE', 'OPCIONAL'], default: 'MONTO' })
  modo_prima!: 'MONTO' | 'PORCENTAJE' | 'OPCIONAL';

  @Column({ name: 'prima', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  prima!: string;

  @Column({ name: 'prima_minima_monto', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  prima_minima_monto!: string;

  @Column({ name: 'prima_minima_porcentaje', type: 'decimal', precision: 8, scale: 2, default: 0.00 })
  prima_minima_porcentaje!: string;

  @Column({ name: 'aplica_interes', type: 'tinyint', default: 0 })
  aplica_interes!: number;

  @Column({ name: 'tasa_interes_anual', type: 'decimal', precision: 8, scale: 2, default: 0.00 })
  tasa_interes_anual!: string;

  @Column({ name: 'es_precio_fijo', type: 'tinyint', default: 1 })
  es_precio_fijo!: number;

  @Column({ name: 'prioridad', type: 'int', default: 0 })
  prioridad!: number;

  @Column({ name: 'orden', type: 'int', default: 0 })
  orden!: number;

  @Column({ name: 'comentario', type: 'longtext', nullable: true })
  comentario!: string | null;

  @Column({ name: 'fecha_inicio', type: 'datetime', nullable: true })
  fecha_inicio!: Date | null;

  @Column({ name: 'fecha_fin', type: 'datetime', nullable: true })
  fecha_fin!: Date | null;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'sucursales', type: 'json', nullable: true })
  sucursales!: unknown | null;

}
