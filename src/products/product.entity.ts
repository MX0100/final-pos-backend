import { Column, Entity, PrimaryGeneratedColumn, VersionColumn, CreateDateColumn, UpdateDateColumn, Check, Index } from 'typeorm';

@Index('idx_products_category_createdAt', ['category'])
@Check('CHK_products_stock_nonnegative', 'stock >= 0')
@Check('CHK_products_price_nonnegative', 'price >= 0')
@Index('uq_products_name', ['name'], { unique: true })
@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  description?: string | null;

  @Column({ type: 'text' })
  image!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  category?: string | null;

  @VersionColumn()
  version!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
