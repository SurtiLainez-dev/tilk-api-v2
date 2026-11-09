import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_cuerpo_solicitud_pagos' })
export class CtCuerpoSolicitudPagos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "ct_solicitud_pago_id", type: "bigint", unsigned: true })
  ct_solicitud_pago_id!: string;

  @Column({ name: "cuerpo_contrato_id", type: "bigint", unsigned: true, nullable: true })
  cuerpo_contrato_id!: string | null;

  @Column({ name: "gasto_id", type: "bigint", unsigned: true, nullable: true })
  gasto_id!: string | null;

  @Column({ name: "nivel", type: "int" })
  nivel!: number;

  @Column({ name: "detalle", type: "varchar", length: 100, nullable: true })
  detalle!: string | null;

  @Column({ name: "total", type: "double" })
  total!: number;

  @Column({ name: "cod_cc", type: "varchar", length: 25 })
  cod_cc!: string;

  @Column({ name: "file_cargado", type: "varchar", length: 300, nullable: true })
  file_cargado!: string | null;

  @Column({ name: "file_pago", type: "varchar", length: 300, nullable: true })
  file_pago!: string | null;

  @Column({ name: "estado", type: "tinyint", default: 0 })
  estado!: number;

  @Column({ name: "caja_id", type: "bigint", unsigned: true, nullable: true })
  caja_id!: string | null;

  @Column({ name: "banco_id", type: "bigint", unsigned: true, nullable: true })
  banco_id!: string | null;

  @Column({ name: "ct_libro_diario_id", type: "bigint", unsigned: true, nullable: true })
  ct_libro_diario_id!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
