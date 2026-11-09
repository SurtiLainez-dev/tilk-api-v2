import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("municipios")
export class Municipios {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  latitud?: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  longitud?: string | null;

  @Column({ type: 'bigint', unsigned: true })
  departamento_id!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at?: string | null;

}
