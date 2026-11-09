import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity("migrations")
export class Migrations {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  migration!: string;

  @Column({ type: 'int' })
  batch!: number;

}
