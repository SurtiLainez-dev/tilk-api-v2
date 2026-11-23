
import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'carrito_compra_bloqueos' })
@Index('uq_bloqueo_carrito', ['carrito_compra_id'], {
    unique: true,
})
@Index('uq_bloqueo_token', ['token_hash'], {
    unique: true,
})
@Index('idx_bloqueo_expiracion', ['expira_at'])
@Index('idx_bloqueo_caja', ['caja_id'])
export class CarritoCompraBloqueos {
    @PrimaryGeneratedColumn({
        name: 'id',
        type: 'bigint',
        unsigned: true,
    })
    id!: string;

    @Column({
        name: 'carrito_compra_id',
        type: 'bigint',
        unsigned: true,
    })
    carrito_compra_id!: string;

    @Column({
        name: 'caja_id',
        type: 'bigint',
        unsigned: true,
    })
    caja_id!: string;

    @Column({
        name: 'user_id',
        type: 'bigint',
        unsigned: true,
    })
    user_id!: string;

    @Column({
        name: 'token_hash',
        type: 'char',
        length: 64,
    })
    token_hash!: string;

    @Column({
        name: 'bloqueado_at',
        type: 'datetime',
        precision: 6,
    })
    bloqueado_at!: Date;

    @Column({
        name: 'expira_at',
        type: 'datetime',
        precision: 6,
    })
    expira_at!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        nullable: true,
    })
    updated_at!: Date | null;
}
