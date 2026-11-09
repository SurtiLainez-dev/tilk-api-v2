import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'caja_sesiones' })
@Index('IDX_caja_sesiones_caja', ['caja_id', 'revoked_at'])
@Index('IDX_caja_sesiones_usuario', ['user_id'])
@Index('IDX_caja_sesiones_expiracion', ['expires_at'])
export class CajaSesiones {
    @PrimaryGeneratedColumn({
        type: 'bigint',
        unsigned: true,
    })
    id!: string;

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    caja_id!: string;

    @Column({
        type: 'bigint',
        unsigned: true,
    })
    user_id!: string;

    @Index({ unique: true })
    @Column({
        type: 'varchar',
        length: 64,
    })
    token_hash!: string;

    @Column({ type: 'datetime' })
    expires_at!: Date;

    @Column({ type: 'datetime' })
    last_activity_at!: Date;

    @Column({
        type: 'datetime',
        nullable: true,
    })
    revoked_at!: Date | null;

    @Column({
        type: 'bigint',
        unsigned: true,
        nullable: true,
    })
    revoked_by!: string | null;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    revocation_reason!: string | null;

    @CreateDateColumn({
        type: 'datetime',
    })
    created_at!: Date;
}