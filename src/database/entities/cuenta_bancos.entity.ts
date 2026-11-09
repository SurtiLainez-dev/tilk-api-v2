import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuenta_bancos' })
export class CuentaBancos {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "descripcion", type: "varchar", length: 100 })
  descripcion!: string;

  @Column({ name: "tipo_cuenta_banco_id", type: "bigint", unsigned: true })
  tipo_cuenta_banco_id!: string;

  @Column({ name: "num", type: "varchar", length: 30 })
  num!: string;

  @Column({ name: "banco_id", type: "bigint", unsigned: true })
  banco_id!: string;

  @Column({ name: "total", type: "double", precision: 20, scale: 2 })
  total!: number;

}
