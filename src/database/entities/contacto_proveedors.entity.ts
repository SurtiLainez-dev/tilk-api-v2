import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'contacto_proveedors' })
export class ContactoProveedors {
  @PrimaryGeneratedColumn({ name: "id", unsigned: true })
  id!: string;

  @Column({ name: "nombre_completo", type: "varchar", length: 50 })
  nombre_completo!: string;

  @Column({ name: "proveedor_id", type: "bigint", unsigned: true })
  proveedor_id!: string;

  @Column({ name: "email", type: "varchar", length: 60 })
  email!: string;

  @Column({ name: "telefono", type: "varchar", length: 13 })
  telefono!: string;

  @Column({ name: "puesto", type: "varchar", length: 25 })
  puesto!: string;

  @Column({ name: "estado", type: "tinyint" })
  estado!: number;

  @Column({ name: "observacion", type: "varchar", length: 400, nullable: true })
  observacion!: string | null;

  @Column({ name: "created_at", type: "timestamp", nullable: true })
  created_at!: string | null;

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updated_at!: string | null;

}
