import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "bancos" })
export class Bancos {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: "50" })
  nombre!: string;
}
