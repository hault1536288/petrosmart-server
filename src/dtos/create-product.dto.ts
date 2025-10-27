import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ProductCategory, ProductUnit } from '../entity/product.entity';

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  sku: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsEnum(ProductUnit)
  unit: ProductUnit;

  @IsNumber()
  @Min(0)
  standardPrice: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;
}
