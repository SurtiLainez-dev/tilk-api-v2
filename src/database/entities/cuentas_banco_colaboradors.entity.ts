import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuentas_banco_colaboradors' })
export class CuentasBancoColaboradors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "colaborador_id", type: "bigint", unsigned: true })
  colaborador_id!: string;

  @Column({ name: "banco_id", type: "bigint", unsigned: true })
  banco_id!: string;

  @Column({ name: "cuenta", type: "varchar", length: 25 })
  cuenta!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
