import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuerpo_planillas' })
export class CuerpoPlanillas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "planilla_id", type: "bigint", unsigned: true })
  planilla_id!: string;

  @Column({ name: "colaborador_id", type: "bigint", unsigned: true })
  colaborador_id!: string;

  @Column({ name: "rango_trabajo_id", type: "bigint", unsigned: true })
  rango_trabajo_id!: string;

  @Column({ name: "dias_trabajados", type: "int" })
  dias_trabajados!: number;

  @Column({ name: "sueldo_base", type: "double", precision: 9, scale: 2 })
  sueldo_base!: number;

  @Column({ name: "pago", type: "double", precision: 9, scale: 2 })
  pago!: number;

  @Column({ name: "total_agregado", type: "double", precision: 9, scale: 2, nullable: true })
  total_agregado!: number | null;

  @Column({ name: "total_deducido", type: "double", precision: 9, scale: 2, nullable: true })
  total_deducido!: number | null;

  @Column({ name: "total_pagar", type: "double", precision: 9, scale: 2 })
  total_pagar!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

  @Column({ name: "is_pagado", type: "tinyint", nullable: true })
  is_pagado!: number | null;

}
