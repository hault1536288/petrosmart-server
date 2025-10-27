import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Station } from './station.entity';
import { Product } from './product.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Station, { eager: true })
  @JoinColumn({ name: 'stationId' })
  station: Station;

  @Column()
  stationId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  quantity: number; // Current stock level

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  reorderLevel: number; // When to reorder

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  maxCapacity: number; // Maximum storage capacity

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  sellingPrice: number; // Price at this station (can differ from standard)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number; // Purchase/cost price

  @Column({ nullable: true })
  lastRestockedAt: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  lastRestockedQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed property (won't be stored in DB)
  get needsReorder(): boolean {
    return this.quantity <= this.reorderLevel;
  }

  get stockPercentage(): number {
    if (this.maxCapacity === 0) return 0;
    return (this.quantity / this.maxCapacity) * 100;
  }
}
