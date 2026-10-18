import mongoose from 'mongoose'

const lineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false })
const purchaseOrderSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  supplier: { type: String, trim: true, default: 'Unassigned supplier' },
  items: { type: [lineSchema], validate: [(items) => items.length > 0, 'At least one item is required'] },
  subtotal: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['draft', 'submitted', 'approved', 'received', 'cancelled'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true })
purchaseOrderSchema.index({ status: 1, createdAt: -1 })
export default mongoose.model('PurchaseOrder', purchaseOrderSchema)
