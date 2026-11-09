import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sucursals' })
export class Sucursals {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ name: 'abreviatura', type: 'varchar', length: 5 })
  abreviatura!: string;

  @Column({ name: 'email', type: 'varchar', length: 50, nullable: true })
  email!: string | null;

  @Column({ name: 'telefono', type: 'varchar', length: 8, nullable: true })
  telefono!: string | null;

  @Column({ name: 'direccion_completa', type: 'varchar', length: 400 })
  direccion_completa!: string;

  @Column({ name: 'ciudade_id', type: 'bigint', unsigned: true })
  ciudade_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'isContable', type: 'tinyint', nullable: true })
  isContable!: number | null;

  @Column({ name: 'cod', type: 'int', nullable: true })
  cod!: number | null;

}
