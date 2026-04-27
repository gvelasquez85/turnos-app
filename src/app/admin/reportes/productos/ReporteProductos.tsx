'use client'
import { useMemo } from 'react'
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface SaleItem {
  product_id: string | null
  product_name: string
  qty: number
  line_total: number
  sales: { created_at: string }
}
interface Product { id: string; name: string; stock: number; min_stock: number; price: number; category: string | null }

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function ReporteProductos({ saleItems, products }: { saleItems: SaleItem[]; products: Product[] }) {
  // Aggregate by product
  const productStats = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; transactions: number }> = {}
    saleItems.forEach(item => {
      const key = item.product_id ?? item.product_name
      if (!map[key]) map[key] = { name: item.product_name, qty: 0, revenue: 0, transactions: 0 }
      map[key].qty += item.qty
      map[key].revenue += item.line_total
      map[key].transactions++
    })
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.qty - a.qty)
  }, [saleItems])

  const topSellers = productStats.slice(0, 10)
  const bottomSellers = [...productStats].sort((a, b) => a.qty - b.qty).slice(0, 5)

  const lowStock = products.filter(p => p.min_stock > 0 && p.stock <= p.min_stock)
  const noStock = products.filter(p => p.stock === 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Productos</h1>
        <p className="text-gray-500 text-sm mt-1">{products.length} productos en inventario</p>
      </div>

      {/* Stock alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className={`rounded-xl border p-4 ${noStock.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className={noStock.length > 0 ? 'text-red-500' : 'text-gray-300'} />
            <p className="text-sm font-semibold text-gray-900">Sin stock</p>
            <span className={`ml-auto text-lg font-bold ${noStock.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{noStock.length}</span>
          </div>
          {noStock.slice(0, 4).map(p => (
            <p key={p.id} className="text-xs text-gray-600 py-0.5">{p.name}</p>
          ))}
        </div>
        <div className={`rounded-xl border p-4 ${lowStock.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className={lowStock.length > 0 ? 'text-amber-500' : 'text-gray-300'} />
            <p className="text-sm font-semibold text-gray-900">Stock bajo</p>
            <span className={`ml-auto text-lg font-bold ${lowStock.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{lowStock.length}</span>
          </div>
          {lowStock.slice(0, 4).map(p => (
            <div key={p.id} className="flex justify-between text-xs text-gray-600 py-0.5">
              <span>{p.name}</span>
              <span className="text-amber-600 font-semibold">{p.stock}/{p.min_stock}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top sellers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900">Más vendidos</h3>
          </div>
          {topSellers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos de ventas</p>
          ) : (
            <div className="space-y-2">
              {topSellers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.qty} unidades · {p.transactions} ventas</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-700 shrink-0">{fmt(p.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom sellers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-gray-900">Menos vendidos</h3>
          </div>
          {bottomSellers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos de ventas</p>
          ) : (
            <div className="space-y-2">
              {bottomSellers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.qty} unidades</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-500 shrink-0">{fmt(p.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All products stock table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Estado de inventario</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-center">Stock</th>
                  <th className="px-4 py-2 text-center">Mín.</th>
                  <th className="px-4 py-2 text-right">Precio</th>
                  <th className="px-4 py-2 text-right">Vendidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => {
                  const stats = productStats.find(s => s.id === p.id)
                  const isLow = p.min_stock > 0 && p.stock <= p.min_stock
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        {p.category && <p className="text-[10px] text-gray-400">{p.category}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-400">{p.min_stock}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-gray-700">{fmt(p.price)}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900">{stats?.qty ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
