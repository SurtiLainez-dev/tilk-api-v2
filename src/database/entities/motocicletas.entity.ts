import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("motocicletas")
export class Motocicletas {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  guia_remision_id?: string | null;

  @Column({ type: 'bigint', unsigned: true })
  remision_articulo_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  placa?: string | null;

  @Column({ type: 'varchar', length: 30 })
  motor!: string;

  @Column({ type: 'varchar', length: 30 })
  chasis!: string;

  @Column({ type: 'varchar', length: 6 })
  cilindraje!: string;

  @Column({ type: 'year' })
  anio!: string;

  @Column({ type: 'varchar', length: 30 })
  color!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

  @Column({ type: 'tinyint', nullable: true })
  facturado?: number | null;

  @Column({ type: 'int', nullable: true })
  factura_proveedor_id?: number | null;

  @Column({ type: 'int', nullable: true, comment: "1:Nunca ha sido notificada. 2:Pendiente de Notificar. 3:Notificada" })
  estado_notificar?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_placa_entregado?: string | null;

  @Column({ type: 'double', default: 0.00 })
  pago_placa!: number;

  @Column({ type: 'varchar', length: 60, default: "SURTIDORA LAINEZ" })
  propietario!: string;

  @Column({ type: 'enum', enum: ["PENDIENTE", "RECIBIDA", "ENTREGADA"], default: "PENDIENTE" })
  estado_placa!: string;

  @Column({ type: 'enum', enum: ["PENDIENTE", "RECIBIDA", "ENTREGADA"], default: "PENDIENTE" })
  estado_boleta!: string;

  @Column({ type: 'enum', enum: ["PENDIENTE_ENVIO_DOCUMENTACIÓN", "RECIBIDO", "ENTREGADO"], default: "PENDIENTE_ENVIO_DOCUMENTACIÓN" })
  estado_traspaso!: string;

}
