import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductCategory {
  FUEL = 'fuel',
  LUBRICANT = 'lubricant',
  ACCESSORY = 'accessory',
  CONVENIENCE = 'convenience',
}

export enum ProductUnit {
  LITER = 'liter',
  GALLON = 'gallon',
  PIECE = 'piece',
  BOX = 'box',
  KILOGRAM = 'kilogram',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string; // Stock Keeping Unit (e.g., "FUEL-RON95", "LUB-ENG-5W30")

  @Column()
  name: string; // e.g., "RON-95", "Engine Oil 5W-30"

  @Column({
    type: 'enum',
    enum: ProductCategory,
  })
  category: ProductCategory;

  @Column({
    type: 'enum',
    enum: ProductUnit,
  })
  unit: ProductUnit; // Unit of measurement

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  standardPrice: number; // Base/suggested price

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  barcode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
