import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: "datos_empresas" })
export class DatosEmpresas {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre", type: "varchar", length: 50 })
  nombre!: string;

  @Column({ name: "rtn", type: "varchar", length: 14 })
  rtn!: string;

  @Column({ name: "logo", type: "varchar", length: 200 })
  logo!: string;

  @Column({ name: "direccion", type: "varchar", length: 200 })
  direccion!: string;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at?: Date | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at?: Date | null;
}
