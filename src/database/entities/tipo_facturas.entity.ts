import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tipo_facturas' })
export class TipoFacturasEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ type: 'int' })
  cantidad_pagos!: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: Date | null;

}
