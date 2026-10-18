import { Router } from 'express'
import Product from '../models/Product.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// GET /api/dashboard/summary — overall inventory metrics + low-stock list
router.get('/summary', protect, async (req, res, next) => {
  try {
    const [inventory, lowStock, openOrders] = await Promise.all([
      Product.aggregate([{
        $group: {
          _id: null,
          value: { $sum: { $multiply: ['$price', '$stock'] } },
          units: { $sum: '$stock' },
          products: { $sum: 1 },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ['$stock', '$reorderPoint'] }, 1, 0] }
          }
        }
      }]),
      Product.find({ $expr: { $lte: ['$stock', '$reorderPoint'] } })
        .select('name sku brand category stock reorderPoint image price')
        .sort({ stock: 1 })
        .limit(10),
      PurchaseOrder.countDocuments({ status: { $in: ['draft', 'submitted', 'approved'] } }),
    ])
    const totals = inventory[0] || { value: 0, units: 0, products: 0, lowStockCount: 0 }
    res.json({
      inventory: {
        value: totals.value,
        units: totals.units,
        products: totals.products,
        lowStockCount: totals.lowStockCount
      },
      lowStock,
      openOrders
    })
  } catch (error) { next(error) }
})

// GET /api/dashboard/analytics — category breakdown for analytics page
router.get('/analytics', protect, async (req, res, next) => {
  try {
    const byCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          totalUnits: { $sum: '$stock' },
          inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
          lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', '$reorderPoint'] }, 1, 0] } },
          outOfStockCount: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        }
      },
      { $sort: { inventoryValue: -1 } }
    ])

    const [totals] = await Product.aggregate([{
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalUnits: { $sum: '$stock' },
        totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
        lowStock: { $sum: { $cond: [{ $lte: ['$stock', '$reorderPoint'] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
      }
    }])

    res.json({
      byCategory: byCategory.map(c => ({
        category: c._id,
        productCount: c.productCount,
        totalUnits: c.totalUnits,
        inventoryValue: c.inventoryValue,
        lowStockCount: c.lowStockCount,
        outOfStockCount: c.outOfStockCount,
      })),
      totals: totals || { totalProducts: 0, totalUnits: 0, totalValue: 0, lowStock: 0, outOfStock: 0 }
    })
  } catch (error) { next(error) }
})

export default router
