import { Product, ProductPackage, Bundle } from '../types/types';

export function calculatePackageStock(pkg: ProductPackage, products: Product[]): bigint {
  // Jika stok manual diaktifkan, gunakan stok manual
  if (pkg.manualStockEnabled && pkg.manualStock !== undefined) {
    return BigInt(pkg.manualStock);
  }
  
  const items = pkg.items || pkg.components || [];
  
  if (!items || items.length === 0) return 0n;
  
  let minStock = BigInt(Number.MAX_SAFE_INTEGER);
  let hasComponents = false;

  for (const item of items) {
    // Cari produk berdasarkan ID (konversi ke string agar aman)
    const product = products.find(p => String(p.id) === String(item.productId));
    
    // Jika produk hilang/dihapus, stok paket otomatis 0
    if (!product || product.isDeleted) {
      return 0n; 
    }

    const requiredQty = BigInt(item.quantity || 0);
    if (requiredQty === 0n) continue;

    // --- PERBAIKAN UTAMA: Konversi Stok Produk ke BigInt ---
    // Kita ambil nilai integer dari stok produk (misal 10.5 jadi 10)
    const currentProductStock = BigInt(Math.floor(Number(product.stock || 0)));
    
    // Sekarang pembagian aman (BigInt / BigInt)
    const possibleQty = currentProductStock / requiredQty;
    
    if (possibleQty < minStock) {
      minStock = possibleQty;
    }
    hasComponents = true;
  }

  return hasComponents ? (minStock === BigInt(Number.MAX_SAFE_INTEGER) ? 0n : minStock) : 0n;
}

export function calculateBundleStock(bundle: Bundle, products: Product[], packages: ProductPackage[]): bigint {
  // Jika stok manual diaktifkan, gunakan stok manual
  if (bundle.manualStockEnabled && bundle.manualStock !== undefined) {
    return BigInt(bundle.manualStock);
  }
  
  const items = bundle.items || [];
  if (items.length === 0) return 0n;

  let minStock = BigInt(Number.MAX_SAFE_INTEGER);

  for (const item of items) {
    if (item.isPackage) {
        // Cek stok Paket
        const pkgId = item.packageId || (item as any).package_id;
        const pkg = packages.find(p => String(p.id) === String(pkgId));
        
        if (pkg) {
            const pkgStock = calculatePackageStock(pkg, products);
            const requiredQty = BigInt(item.quantity || 1);
            if (requiredQty > 0n) {
                const possibleQty = pkgStock / requiredQty;
                if (possibleQty < minStock) minStock = possibleQty;
            }
            continue;
        }
        return 0n; 
    } else {
        // Cek stok Produk
        const prodId = item.productId || (item as any).product_id;
        const product = products.find(p => String(p.id) === String(prodId));
        
        if (product) {
            const productStock = BigInt(Math.floor(Number(product.stock || 0)));
            const requiredQty = BigInt(item.quantity || 1);
            if (requiredQty > 0n) {
                const qty = productStock / requiredQty;
                if (qty < minStock) minStock = qty;
            }
            continue;
        }
        return 0n; 
    }
  }
  
  return minStock === BigInt(Number.MAX_SAFE_INTEGER) ? 0n : minStock;
}