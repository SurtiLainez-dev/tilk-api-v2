import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'oauth_refresh_tokens' })
export class OauthRefreshTokens {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 100 })
  id!: string;

  @Column({ name: 'access_token_id', type: 'varchar', length: 100 })
  access_token_id!: string;

  @Column({ name: 'revoked', type: 'tinyint' })
  revoked!: number;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expires_at!: Date | null;

}
