import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  brand: { type: String, required: true, trim: true, maxlength: 80 },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  reorderPoint: { type: Number, required: true, min: 0, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  image: { type: String, trim: true, default: '' },
}, { timestamps: true })
productSchema.index({ name: 'text', brand: 'text', sku: 'text' })
productSchema.index({ category: 1, stock: 1 })
export default mongoose.model('Product', productSchema)
