import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cob_bitacora_portafolios" })
export class CobBitacoraPortafolios {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "colaborador_id", type: "bigint", unsigned: true })
  colaborador_id!: string;

  @Column({ name: "cob_portafolio_id", type: "bigint", unsigned: true })
  cob_portafolio_id!: string;

  @Column({ name: "comentario", type: "text" })
  comentario!: string;

  @Column({ name: "normalidad", type: "double", precision: 5, scale: 2 })
  normalidad!: number;

  @Column({ name: "normalidad_proyectada", type: "double", precision: 5, scale: 2 })
  normalidad_proyectada!: number;

  @Column({ name: "valor_cuotas", type: "double", precision: 9, scale: 2 })
  valor_cuotas!: number;

  @Column({ name: "cantidad_cuentas", type: "int" })
  cantidad_cuentas!: number;

  @Column({ name: "fecha_guardado", type: "date" })
  fecha_guardado!: string;

  @Column({ name: "valor_portafolio", type: "double", precision: 9, scale: 2 })
  valor_portafolio!: number;

  @Column({ name: "saldo_corriente", type: "double", precision: 9, scale: 2 })
  saldo_corriente!: number;

  @Column({ name: "saldo_proyeccion", type: "double", precision: 9, scale: 2 })
  saldo_proyeccion!: number;

  @Column({ name: "saldo_cumplimiento", type: "double", precision: 9, scale: 2 })
  saldo_cumplimiento!: number;

  @Column({ name: "valor_cuotas_proyeccion", type: "double", precision: 9, scale: 2 })
  valor_cuotas_proyeccion!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "abonos", type: "json", nullable: true })
  abonos!: unknown | null;
}
