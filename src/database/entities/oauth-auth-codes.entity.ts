import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'oauth_auth_codes' })
export class OauthAuthCodes {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 100 })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  user_id!: string;

  @Column({ name: 'client_id', type: 'bigint', unsigned: true })
  client_id!: string;

  @Column({ name: 'scopes', type: 'text', nullable: true })
  scopes!: string | null;

  @Column({ name: 'revoked', type: 'tinyint' })
  revoked!: number;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expires_at!: Date | null;

}
