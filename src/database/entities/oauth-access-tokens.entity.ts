import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'oauth_access_tokens' })
export class OauthAccessTokens {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 100 })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  user_id!: string | null;

  @Column({ name: 'client_id', type: 'bigint', unsigned: true })
  client_id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ name: 'scopes', type: 'text', nullable: true })
  scopes!: string | null;

  @Column({ name: 'revoked', type: 'tinyint' })
  revoked!: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  created_at!: Date | null;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at!: Date | null;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expires_at!: Date | null;

}
