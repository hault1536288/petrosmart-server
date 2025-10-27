import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action, AppAbility } from '../casl/casl-ability.factory';
import { Product, ProductCategory } from '../entity/product.entity';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async findAll(
    @Query('category') category?: ProductCategory,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return await this.productService.findAll({
      category,
      search,
      isActive: isActive ? isActive === 'true' : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  }

  @Get('active')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async findActive() {
    return await this.productService.findActive();
  }

  @Get('inactive')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async findInactive() {
    return await this.productService.findInactive();
  }

  @Get('category/:category')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async findByCategory(@Param('category') category: ProductCategory) {
    return await this.productService.findByCategory(category);
  }

  @Get('fuels')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async getFuels() {
    return await this.productService.getFuels();
  }

  @Get('lubricants')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async getLubricants() {
    return await this.productService.getLubricants();
  }

  @Get('accessories')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async getAccessories() {
    return await this.productService.getAccessories();
  }

  @Get('convenience')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async getConvenience() {
    return await this.productService.getConvenience();
  }

  @Get('search')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async search(@Query('q') searchTerm: string) {
    return await this.productService.search(searchTerm);
  }

  @Get('stats/count-by-category')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async getCountByCategory() {
    return await this.productService.getCountByCategory();
  }

  @Get('stats/count')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async count() {
    const total = await this.productService.count();
    const active = await this.productService.countActive();
    return { total, active, inactive: total - active };
  }

  @Get('sku/:sku')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async findBySku(@Param('sku') sku: string) {
    return await this.productService.findBySku(sku);
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Product))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.findOne(id);
  }

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Product))
  async create(@Body() createProductDto: CreateProductDto) {
    // Check if SKU already exists
    const exists = await this.productService.skuExists(createProductDto.sku);
    if (exists) {
      throw new Error('Product with this SKU already exists');
    }
    return await this.productService.create(createProductDto);
  }

  @Patch(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Product))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    // Check if SKU already exists (excluding current product)
    if (updateProductDto.sku) {
      const exists = await this.productService.skuExists(
        updateProductDto.sku,
        id,
      );
      if (exists) {
        throw new Error('Product with this SKU already exists');
      }
    }
    return await this.productService.update(id, updateProductDto);
  }

  @Patch(':id/deactivate')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Product))
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.deactivate(id);
  }

  @Patch(':id/activate')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Product))
  async activate(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.activate(id);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, Product))
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productService.remove(id);
  }
}
