export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }) }
export function errorHandler(error, req, res, next) {
  console.error(error)
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => item.message)
    return res.status(400).json({ message: errors[0] || 'Validation failed.', errors })
  }
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Invalid ID format.' })
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field'
    const value = error.keyValue?.[field] || ''
    return res.status(409).json({ message: `A product with that ${field} (${value}) already exists.` })
  }
  res.status(error.status || 500).json({ message: error.message || 'Something went wrong on the server. Please try again.' })
}
