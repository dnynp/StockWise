import { Router } from 'express'
import Product from '../models/Product.js'
import { protect, allow } from '../middleware/auth.js'

const router = Router()
router.use(protect)
router.get('/', async (req, res, next) => {
  try {
    const { search = '', category, lowStock, page = 1, limit = 24 } = req.query
    const query = {}
    if (search) query.$text = { $search: search }
    if (category) query.category = category
    if (lowStock === 'true') query.$expr = { $lte: ['$stock', '$reorderPoint'] }
    const take = Math.min(Math.max(Number(limit), 1), 100)
    const skip = (Math.max(Number(page), 1) - 1) * take
    const [products, total] = await Promise.all([Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(take), Product.countDocuments(query)])
    res.json({ products, pagination: { total, page: Number(page), pages: Math.ceil(total / take) } })
  } catch (error) { next(error) }
})
router.get('/categories', async (req, res, next) => {
  try { res.json({ categories: await Product.distinct('category') }) } catch (error) { next(error) }
})
router.get('/:id', async (req, res, next) => {
  try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: 'Product not found.' }); res.json({ product }) } catch (error) { next(error) }
})
router.post('/', allow('admin', 'manager'), async (req, res, next) => { try { res.status(201).json({ product: await Product.create(req.body) }) } catch (error) { next(error) } })
router.patch('/:id', allow('admin', 'manager'), async (req, res, next) => {
  try { const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!product) return res.status(404).json({ message: 'Product not found.' }); res.json({ product }) } catch (error) { next(error) }
})
router.delete('/:id', allow('admin'), async (req, res, next) => {
  try { const product = await Product.findByIdAndDelete(req.params.id); if (!product) return res.status(404).json({ message: 'Product not found.' }); res.status(204).end() } catch (error) { next(error) }
})
export default router
