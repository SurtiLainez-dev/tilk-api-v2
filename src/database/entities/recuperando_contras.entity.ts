import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'recuperando_contras' })
export class RecuperandoContrasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'cod', type: 'varchar', length: 6 })
  cod!: string;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'correo', type: 'varchar', length: 50 })
  correo!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
