import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { User } from './user.entity';

export enum TransactionType {
  RESTOCK = 'restock', // Adding inventory
  SALE = 'sale', // Selling to customer
  ADJUSTMENT = 'adjustment', // Manual correction
  TRANSFER = 'transfer', // Transfer between stations
  WASTE = 'waste', // Spillage, expiry, etc.
  RETURN = 'return', // Customer return
}

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inventory)
  @JoinColumn({ name: 'inventoryId' })
  inventory: Inventory;

  @Column()
  inventoryId: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number; // Positive for additions, negative for deductions

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  previousQuantity: number; // Quantity before transaction

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  newQuantity: number; // Quantity after transaction

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number; // Price per unit for this transaction

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number; // Total transaction value

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  referenceNumber: string; // Invoice number, PO number, etc.

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column()
  performedById: number;

  @CreateDateColumn()
  createdAt: Date;
}
