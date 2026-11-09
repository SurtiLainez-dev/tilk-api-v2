import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ct_historial_solicitud_pagos' })
export class CtHistorialSolicitudPagos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "ct_solicitud_pago_id", type: "bigint", unsigned: true })
  ct_solicitud_pago_id!: string;

  @Column({ name: "detalle", type: "varchar", length: 300 })
  detalle!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
