import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_pagos_extras' })
export class CuerpoPagosExtras {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "recibo_id", type: "bigint", unsigned: true })
  recibo_id!: string;

  @Column({ name: "pagos_extras_venta_id", type: "bigint", unsigned: true })
  pagos_extras_venta_id!: string;

  @Column({ name: "detalle", type: "varchar", length: 250 })
  detalle!: string;

  @Column({ name: "total", type: "double", precision: 9, scale: 2 })
  total!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
