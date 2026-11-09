import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cob_portafolios" })
export class CobPortafolios {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "sucursal_id", type: "bigint", unsigned: true })
  sucursal_id!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  user_id!: string;

  @Column({ name: "nombre", type: "varchar", length: "50", comment: "Es el nombre del portafolio" })
  nombre!: string;

  @Column({ name: "codigo", type: "varchar", length: "10", comment: "codigo del portafolio" })
  codigo!: string;

  @Column({ name: "total_ingresos", type: "double", precision: 11, scale: 2, default: "0.00", comment: "suma de todos los saldos de las cuentas capital (suma de todos los saldos)" })
  total_ingresos!: number;

  @Column({ name: "valor_cuotas", type: "double", precision: 9, scale: 2, comment: "Es valor de la cuotas sumadas" })
  valor_cuotas!: number;

  @Column({ name: "cant_cuentas", type: "int", comment: "Es la cantidad de cuentas con las que cuenta la cartera" })
  cant_cuentas!: number;

  @Column({ name: "normalidad", type: "double", precision: 5, scale: 2 })
  normalidad!: number;

  @Column({ name: "saldo_cumplimiento", type: "double", precision: 9, scale: 2, comment: "Es el saldo de la proyeccion que se abono" })
  saldo_cumplimiento!: number;

  @Column({ name: "historial", type: "json", nullable: true })
  historial!: unknown | null;

  @Column({ name: "reporte", type: "json", nullable: true })
  reporte!: unknown | null;

  @Column({ name: "gerencial", type: "tinyint" })
  gerencial!: number;

  @Column({ name: "segmentos", type: "json", nullable: true })
  segmentos!: unknown | null;

  @Column({ name: "fecha_cierre", type: "date", nullable: true })
  fecha_cierre!: string | null;

  @Column({ name: "ultima_fecha_revision", type: "date", nullable: true })
  ultima_fecha_revision!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "total_corriente", type: "double", precision: 9, scale: 2, comment: "ES EL SALDO TOTAL DE TODAS LAS CUENTAS CORRIENTES" })
  total_corriente!: number;

  @Column({ name: "saldo_proyeccion", type: "double", precision: 9, scale: 2, comment: "Es el total de saldo que se tiene que cobrar" })
  saldo_proyeccion!: number;

  @Column({ name: "proyeccion_normalidad", type: "double", precision: 5, scale: 2, comment: "Es la proyeccion de la normalidad" })
  proyeccion_normalidad!: number;

  @Column({ name: "valor_cuotas_proyeccion", type: "double", precision: 9, scale: 2, default: "0.00" })
  valor_cuotas_proyeccion!: number;
}
