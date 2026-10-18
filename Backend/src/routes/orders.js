import { Router } from 'express'
import Product from '../models/Product.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import { protect, allow } from '../middleware/auth.js'

const router = Router()
router.use(protect)
router.get('/', async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id }
    if (req.query.status) query.status = req.query.status
    const orders = await PurchaseOrder.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 })
    res.json({ orders })
  } catch (error) { next(error) }
})
router.post('/', async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ message: 'An order needs at least one item.' })
    const productIds = items.map((item) => item.productId)
    const products = await Product.find({ _id: { $in: productIds } })
    if (products.length !== productIds.length) return res.status(400).json({ message: 'One or more products do not exist.' })
    const byId = new Map(products.map((product) => [String(product._id), product]))
    const orderItems = items.map(({ productId, quantity }) => {
      const product = byId.get(String(productId)); const units = Number(quantity)
      if (!Number.isInteger(units) || units < 1) throw Object.assign(new Error('Each quantity must be a whole number greater than zero.'), { status: 400 })
      return { product: product._id, name: product.name, sku: product.sku, quantity: units, unitPrice: product.price }
    })
    const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const number = `PO-${Date.now().toString().slice(-8)}`
    const order = await PurchaseOrder.create({ number, supplier: req.body.supplier, notes: req.body.notes, items: orderItems, subtotal, createdBy: req.user._id })
    res.status(201).json({ order })
  } catch (error) { next(error) }
})
router.patch('/:id/status', allow('admin', 'manager'), async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Purchase order not found.' })
    const status = req.body.status
    if (!['draft', 'submitted', 'approved', 'received', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid order status.' })
    if (status === 'received' && order.status !== 'received') {
      for (const item of order.items) await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
    }
    order.status = status; await order.save()
    res.json({ order })
  } catch (error) { next(error) }
})
export default router
