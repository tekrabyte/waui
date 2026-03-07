import { Product, ProductPackage, Bundle } from '../types/types';

export function calculatePackageStock(pkg: ProductPackage, products: Product[]): number {
  // Jika stok manual diaktifkan, gunakan stok manual
  if (pkg.manualStockEnabled && pkg.manualStock !== undefined) {
    return Number(pkg.manualStock);
  }
  
  const items = pkg.items || pkg.components || [];
  
  if (!items || items.length === 0) return 0;
  
  let minStock = Number.MAX_SAFE_INTEGER;
  let hasComponents = false;

  for (const item of items) {
    const product = products.find(p => String(p.id) === String(item.productId));
    
    if (!product || product.isDeleted) {
      return 0; 
    }

    const requiredQty = Number(item.quantity || 0);
    if (requiredQty === 0) continue;

    const currentProductStock = Math.floor(Number(product.stock || 0));
    const possibleQty = Math.floor(currentProductStock / requiredQty);
    
    if (possibleQty < minStock) {
      minStock = possibleQty;
    }
    hasComponents = true;
  }

  return hasComponents ? (minStock === Number.MAX_SAFE_INTEGER ? 0 : minStock) : 0;
}

export function calculateBundleStock(bundle: Bundle, products: Product[], packages: ProductPackage[]): number {
  // Jika stok manual diaktifkan, gunakan stok manual
  if (bundle.manualStockEnabled && bundle.manualStock !== undefined) {
    return Number(bundle.manualStock);
  }
  
  const items = bundle.items || [];
  if (items.length === 0) return 0;

  let minStock = Number.MAX_SAFE_INTEGER;

  for (const item of items) {
    if (item.isPackage) {
        const pkgId = item.packageId || (item as any).package_id;
        const pkg = packages.find(p => String(p.id) === String(pkgId));
        
        if (pkg) {
            const pkgStock = calculatePackageStock(pkg, products);
            const requiredQty = Number(item.quantity || 1);
            if (requiredQty > 0) {
                const possibleQty = Math.floor(pkgStock / requiredQty);
                if (possibleQty < minStock) minStock = possibleQty;
            }
            continue;
        }
        return 0; 
    } else {
        const prodId = item.productId || (item as any).product_id;
        const product = products.find(p => String(p.id) === String(prodId));
        
        if (product) {
            const productStock = Math.floor(Number(product.stock || 0));
            const requiredQty = Number(item.quantity || 1);
            if (requiredQty > 0) {
                const qty = Math.floor(productStock / requiredQty);
                if (qty < minStock) minStock = qty;
            }
            continue;
        }
        return 0; 
    }
  }
  
  return minStock === Number.MAX_SAFE_INTEGER ? 0 : minStock;
}