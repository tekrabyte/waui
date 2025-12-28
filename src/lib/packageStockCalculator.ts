import { Product, ProductPackage, Bundle } from '../types';

export function calculatePackageStock(pkg: ProductPackage, products: Product[]): bigint {
  // Gunakan items (standar baru) atau fallback ke components (kode lama)
  const items = pkg.items || pkg.components || [];
  
  if (items.length === 0) return 0n;
  
  let minStock = BigInt(Number.MAX_SAFE_INTEGER);
  let hasComponents = false;

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    // Cek product availability, anggap 0 jika produk dihapus
    if (!product || product.isDeleted) {
      return 0n; 
    }

    const requiredQty = BigInt(item.quantity);
    if (requiredQty === 0n) continue;

    // Perhitungan stok: Product Stock / Required Qty
    const possibleQty = product.stock / requiredQty;
    if (possibleQty < minStock) {
      minStock = possibleQty;
    }
    hasComponents = true;
  }

  return hasComponents ? minStock : 0n;
}

export function calculateBundleStock(bundle: Bundle, products: Product[], packages: ProductPackage[]): bigint {
  if (!bundle.items || bundle.items.length === 0) return 0n;

  let minStock = BigInt(Number.MAX_SAFE_INTEGER);

  for (const item of bundle.items) {
    const product = products.find(p => p.id === item.productId);
    if (product) {
       const qty = product.stock / BigInt(item.quantity);
       if (qty < minStock) minStock = qty;
       continue;
    }
    return 0n;
  }
  
  return minStock === BigInt(Number.MAX_SAFE_INTEGER) ? 0n : minStock;
}