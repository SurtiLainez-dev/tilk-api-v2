import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sub_modulos_usuarios' })
export class SubModulosUsuariosEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ name: 'num', type: 'int' })
  num!: number;

  @Column({ name: 'modulo_id', type: 'bigint', unsigned: true })
  modulo_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
