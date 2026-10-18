import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  username: { type: String, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 3, select: false },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
}, { timestamps: true })

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12)
})
userSchema.methods.matchesPassword = function matchesPassword(password) { return bcrypt.compare(password, this.password) }
export default mongoose.model('User', userSchema)
