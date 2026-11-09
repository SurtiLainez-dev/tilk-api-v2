import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class Users {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'usuario', type: 'varchar', length: 70 })
  usuario!: string;

  @Column({ name: 'colaborador_id', type: 'bigint', unsigned: true, nullable: true })
  colaborador_id!: string | null;

  @Column({ name: 'email', type: 'varchar', length: 50 })
  email!: string;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  email_verified_at!: Date | null;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password!: string;

  @Column({ name: 'tipo_usuario_id', type: 'bigint', unsigned: true })
  tipo_usuario_id!: string;

  @Column({ name: 'estado', type: 'tinyint' })
  estado!: number;

  @Column({ name: 'datos_empresa_id', type: 'bigint', unsigned: true })
  datos_empresa_id!: string;

  @Column({ name: 'remember_token', type: 'varchar', length: 100, nullable: true })
  remember_token!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'mini_token', type: 'varchar', length: 100, nullable: true })
  mini_token!: string | null;

  @Column({ name: 'password_email', type: 'varchar', length: 255, nullable: true })
  password_email!: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  user_email!: string | null;

  @Column({ name: 'cliente_id', type: 'bigint', unsigned: true, nullable: true })
  cliente_id!: string | null;

  @Column({ name: 'cod_verificacion', type: 'varchar', length: 8, nullable: true })
  cod_verificacion!: string | null;

}
