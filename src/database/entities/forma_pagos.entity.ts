import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "forma_pagos" })
export class FormaPagos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: 30 })
  nombre!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;

  @Column({ name: "is_tarjeta", type: "int", nullable: true })
  is_tarjeta?: number | null;

  @Column({ name: "cuenta_banco_id", type: "bigint", unsigned: true, nullable: true })
  cuenta_banco_id?: string | null;
}
