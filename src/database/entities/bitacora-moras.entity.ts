import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "bitacora_moras" })
export class BitacoraMoras {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "hora_inicio", type: "varchar", length: "255" })
  hora_inicio!: string;

  @Column({ name: "hora_final", type: "varchar", length: "255" })
  hora_final!: string;

  @Column({ name: "cod_venta", type: "varchar", length: "255", default: "0" })
  cod_venta!: string;

  @Column({ name: "dias_mora", type: "varchar", length: "255", default: "0" })
  dias_mora!: string;

  @Column({ name: "dias_mora_3", type: "varchar", length: "255", default: "0" })
  dias_mora_3!: string;

  @Column({ name: "descripcion_is_mora", type: "varchar", length: "255", default: "0" })
  descripcion_is_mora!: string;

  @Column({ name: "saldo_actual_mora", type: "double", precision: 9, scale: 2, default: "0.00" })
  saldo_actual_mora!: number;

  @Column({ name: "mora_generada_hoy", type: "double", precision: 9, scale: 2, default: "0.00" })
  mora_generada_hoy!: number;

  @Column({ name: "saldo_actual_mora_cuenta", type: "double", precision: 9, scale: 2, default: "0.00" })
  saldo_actual_mora_cuenta!: number;

  @Column({ name: "monto_mora", type: "double", precision: 9, scale: 2, default: "0.00" })
  monto_mora!: number;

  @Column({ name: "nuevo_saldo_mora", type: "double", precision: 9, scale: 2, default: "0.00" })
  nuevo_saldo_mora!: number;

  @Column({ name: "inicio_mora", type: "date", nullable: true })
  inicio_mora!: string | null;

  @Column({ name: "total_dias_mora", type: "varchar", length: "255", default: "0" })
  total_dias_mora!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: Date | null;
}
