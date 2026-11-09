import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'oauth_clients' })
export class OauthClients {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'secret', type: 'varchar', length: 100, nullable: true })
  secret!: string | null;

  @Column({ name: 'redirect', type: 'text' })
  redirect!: string;

  @Column({ name: 'personal_access_client', type: 'tinyint' })
  personal_access_client!: number;

  @Column({ name: 'password_client', type: 'tinyint' })
  password_client!: number;

  @Column({ name: 'revoked', type: 'tinyint' })
  revoked!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

}
