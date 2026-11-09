import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_solicitud_pagos' })
export class CtSolicitudPagos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "detalle", type: "text" })
  detalle!: string;

  @Column({ name: "detalle_print", type: "varchar", length: 200, comment: "lo que saldra en la partida y pdf de solicutud" })
  detalle_print!: string;

  @Column({ name: "cod", type: "varchar", length: 15, comment: "correlatico del documento" })
  cod!: string;

  @Column({ name: "file", type: "varchar", length: 300, nullable: true })
  file!: string | null;

  @Column({ name: "tipo", type: "int", comment: "1: Extendida - 2: Normal" })
  tipo!: number;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true, nullable: true })
  proveedor_id!: string | null;

  @Column({ name: "ct_acreedor_id", type: "bigint", unsigned: true, nullable: true })
  ct_acreedor_id!: string | null;

  @Column({ name: "fecha_acreditacion", type: "date", nullable: true, comment: "fecha en que se acredita a las cuentas, automaticamente" })
  fecha_acreditacion!: string | null;

  @Column({ name: "fecha_programado", type: "date", nullable: true, comment: "fecha en que estan programados los pagos" })
  fecha_programado!: string | null;

  @Column({ name: "total_acumulado", type: "double", precision: 11, scale: 2, default: 0.0, comment: "es el total que se ha acreditado a esta solicitud" })
  total_acumulado!: number;

  @Column({ name: "total_pago", type: "double", precision: 11, scale: 2, comment: "es el total a acreditar" })
  total_pago!: number;

  @Column({ name: "estado", type: "tinyint", default: 0 })
  estado!: number;

  @Column({ name: "cant_pagos", type: "int" })
  cant_pagos!: number;

  @Column({ name: "tipo_busqueda", type: "int" })
  tipo_busqueda!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "solicitudes", type: "json", nullable: true })
  solicitudes!: unknown | null;

}
