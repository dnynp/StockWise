import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function protect(req, res, next) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const { userId } = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    req.user = await User.findById(userId)
    if (!req.user) return res.status(401).json({ message: 'User no longer exists.' })
    next()
  } catch { return res.status(401).json({ message: 'Invalid or expired token.' }) }
}
export const allow = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission for this action.' })
