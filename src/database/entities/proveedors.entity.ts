import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'proveedors' })
export class ProveedorsEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ name: 'rtn', type: 'varchar', length: 20, nullable: true })
  rtn!: string | null;

  @Column({ name: 'pais', type: 'varchar', length: 30 })
  pais!: string;

  @Column({ name: 'codigo_postal', type: 'varchar', length: 7, nullable: true })
  codigo_postal!: string | null;

  @Column({ name: 'direccion', type: 'varchar', length: 450 })
  direccion!: string;

  @Column({ name: 'logo', type: 'varchar', length: 250, nullable: true })
  logo!: string | null;

  @Column({ name: 'email', type: 'varchar', length: 60, nullable: true })
  email!: string | null;

  @Column({ name: 'telefono', type: 'varchar', length: 13 })
  telefono!: string;

  @Column({ name: 'swift', type: 'varchar', length: 9, nullable: true })
  swift!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
