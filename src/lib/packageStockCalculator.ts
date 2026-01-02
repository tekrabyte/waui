import { Product, ProductPackage, Bundle } from '../types/types';

export function calculatePackageStock(pkg: ProductPackage, products: Product[]): bigint {
  // Gunakan items (standar baru) atau fallback ke components (kode lama)
  const items = pkg.items || pkg.components || [];
  
  if (!items || items.length === 0) return 0n;
  
  // Inisialisasi dengan nilai maksimum
  let minStock = BigInt(Number.MAX_SAFE_INTEGER);
  let hasComponents = false;

  for (const item of items) {
    // Pastikan ID dibandingkan sebagai string
    const product = products.find(p => String(p.id) === String(item.productId));
    
    // Jika produk tidak ditemukan atau dihapus, stok paket = 0
    if (!product || product.isDeleted) {
      return 0n; 
    }

    const requiredQty = BigInt(item.quantity || 0);
    if (requiredQty === 0n) continue;

    // FIX UTAMA: Konversi product.stock (number) ke BigInt sebelum pembagian
    const productStock = BigInt(product.stock || 0);
    const possibleQty = productStock / requiredQty;
    
    if (possibleQty < minStock) {
      minStock = possibleQty;
    }
    hasComponents = true;
  }

  // Jika tidak ada komponen valid, return 0. Jika ada, return minStock.
  return hasComponents ? (minStock === BigInt(Number.MAX_SAFE_INTEGER) ? 0n : minStock) : 0n;
}

export function calculateBundleStock(bundle: Bundle, products: Product[], packages: ProductPackage[]): bigint {
  const items = bundle.items || [];
  if (items.length === 0) return 0n;

  let minStock = BigInt(Number.MAX_SAFE_INTEGER);

  for (const item of items) {
    if (item.isPackage) {
        // Logika untuk Paket dalam Bundle
        const pkg = packages.find(p => String(p.id) === String(item.packageId));
        if (pkg) {
            // Hitung stok paket secara rekursif
            const pkgStock = calculatePackageStock(pkg, products);
            const requiredQty = BigInt(item.quantity || 1);
            if (requiredQty > 0n) {
                const possibleQty = pkgStock / requiredQty;
                if (possibleQty < minStock) minStock = possibleQty;
            }
            continue;
        }
        return 0n; // Paket tidak ditemukan
    } else {
        // Logika untuk Produk dalam Bundle
        const product = products.find(p => String(p.id) === String(item.productId));
        if (product) {
            const productStock = BigInt(product.stock || 0);
            const requiredQty = BigInt(item.quantity || 1);
            
            if (requiredQty > 0n) {
                const qty = productStock / requiredQty;
                if (qty < minStock) minStock = qty;
            }
            continue;
        }
        return 0n; // Produk tidak ditemukan
    }
  }
  
  return minStock === BigInt(Number.MAX_SAFE_INTEGER) ? 0n : minStock;
}