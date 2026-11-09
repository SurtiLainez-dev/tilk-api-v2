import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'token_cuentas' })
export class TokenCuentasEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'venta_id', type: 'bigint', unsigned: true })
  venta_id!: string;

  @Column({ name: 'expiracion', type: 'datetime' })
  expiracion!: Date;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado!: number;

  @Column({ name: 'token', type: 'varchar', length: 80 })
  token!: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
