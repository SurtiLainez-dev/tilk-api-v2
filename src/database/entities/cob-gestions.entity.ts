import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "cob_gestions" })
export class CobGestions {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "venta_id", type: "bigint", unsigned: true })
  venta_id!: string;

  @Column({ name: "cob_portafolio_id", type: "bigint", unsigned: true, nullable: true })
  cob_portafolio_id!: string | null;

  @Column({ name: "cob_segmento_id", type: "bigint", unsigned: true })
  cob_segmento_id!: string;

  @Column({ name: "estado", type: "varchar", length: "255", comment: "1: pendiente, 2:cerrado, 3:cuenta cancelada" })
  estado!: string;

  @Column({ name: "titulo", type: "varchar", length: "255", comment: "Es el titulo de la gestion" })
  titulo!: string;

  @Column({ name: "archivos", type: "json", nullable: true })
  archivos!: unknown | null;

  @Column({ name: "comentarios", type: "json", nullable: true })
  comentarios!: unknown | null;

  @Column({ name: "recordatorios", type: "json", nullable: true, comment: "Es elhistorial de los recordatorios" })
  recordatorios!: unknown | null;

  @Column({ name: "fecha_gestion", type: "date" })
  fecha_gestion!: string;

  @Column({ name: "intereses", type: "double", precision: 9, scale: 2, comment: "saldo de intereses del capital" })
  intereses!: number;

  @Column({ name: "saldo_abonado", type: "double", precision: 9, scale: 2, comment: "Es el saldo abonado del cliente" })
  saldo_abonado!: number;

  @Column({ name: "pagando", type: "double", precision: 9, scale: 2, comment: "Es el total de todas las cuotas sin mora" })
  pagando!: number;

  @Column({ name: "estado_nueva", type: "int", default: "1", comment: "1: nueva, 2: vieja. Determina si la cuenta es nueva o vieja" })
  estado_nueva!: number;

  @Column({ name: "nataruleza_normal", type: "tinyint", default: "1", comment: "Determina si la gestion avanza segun los segmentos. Es para saber si el programa lo mueve automaticamente" })
  nataruleza_normal!: number;

  @Column({ name: "saldo_actual", type: "double", default: "0", comment: "Es el saldo actual de la cuenta sin mora" })
  saldo_actual!: number;

  @Column({ name: "saldo_dia", type: "double", default: "0", comment: "Es la suma de pagando mas intereses para ponerse al dia" })
  saldo_dia!: number;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;

  @Column({ name: "gestiones", type: "json", nullable: true })
  gestiones!: unknown | null;
}
