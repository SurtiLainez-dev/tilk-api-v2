
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'carrito_compra_regalias' })
@Index('uq_carrito_regalia', [
    'cuerpo_carrito_compra_id',
    'cuerpo_carrito_regalia_id',
], { unique: true })
@Index('idx_regalias_carrito', ['carrito_compra_id'])
export class CarritoCompraRegalias {
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

    @Column({ name: 'user_id', type: 'bigint', unsigned: true })
    user_id!: string;

    @Column({
        name: 'cuerpo_carrito_compra_id',
        type: 'bigint',
        unsigned: true,
    })
    cuerpo_carrito_compra_id!: string;

    @Column({
        name: 'cuerpo_carrito_regalia_id',
        type: 'bigint',
        unsigned: true,
    })
    cuerpo_carrito_regalia_id!: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        nullable: true,
    })
    created_at!: Date | null;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        nullable: true,
    })
    updated_at!: Date | null;
}
