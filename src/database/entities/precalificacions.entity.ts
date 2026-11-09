import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'precalificacions' })
export class Precalificacions {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'cliente_id', type: 'bigint', unsigned: true })
  cliente_id!: string;

  @Column({ name: 'articulo_id', type: 'bigint', unsigned: true, nullable: true })
  articulo_id!: string | null;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: 'limite_solicitado', type: 'varchar', length: 255 })
  limite_solicitado!: string;

  @Column({ name: 'limite_aprobado', type: 'double', precision: 9, scale: 2, default: 0.00 })
  limite_aprobado!: number;

  @Column({ name: 'forma_pago_solicitado', type: 'varchar', length: 255 })
  forma_pago_solicitado!: string;

  @Column({ name: 'forma_pago_aprobado', type: 'varchar', length: 255, nullable: true })
  forma_pago_aprobado!: string | null;

  @Column({ name: 'fecha_abono_solicitado', type: 'varchar', length: 255, nullable: true })
  fecha_abono_solicitado!: string | null;

  @Column({ name: 'fecha_abono_aprobado', type: 'varchar', length: 255, nullable: true })
  fecha_abono_aprobado!: string | null;

  @Column({ name: 'sin_prima_solicitado', type: 'tinyint' })
  sin_prima_solicitado!: number;

  @Column({ name: 'sin_prima_aprobado', type: 'tinyint', nullable: true })
  sin_prima_aprobado!: number | null;

  @Column({ name: 'cod', type: 'varchar', length: 25 })
  cod!: string;

  @Column({ name: 'fecha_cerrado', type: 'date' })
  fecha_cerrado!: string;

  @Column({ name: 'estado_precalificacion_id', type: 'bigint', unsigned: true })
  estado_precalificacion_id!: string;

  @Column({ name: 'terminos_condiciones', type: 'tinyint', default: 0 })
  terminos_condiciones!: number;

  @Column({ name: 'sdc_sin_firma', type: 'tinyint', default: 0 })
  sdc_sin_firma!: number;

  @Column({ name: 'consulta_buro_credito', type: 'tinyint', default: 0 })
  consulta_buro_credito!: number;

  @Column({ name: 'comentario', type: 'varchar', length: 255 })
  comentario!: string;

  @Column({ name: 'telefono', type: 'varchar', length: 255, nullable: true })
  telefono!: string | null;

  @Column({ name: 'token', type: 'varchar', length: 255, nullable: true })
  token!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'firma_path', type: 'varchar', length: 400, nullable: true })
  firma_path!: string | null;

}
