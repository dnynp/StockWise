import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api.js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

// ─── constants ──────────────────────────────────────────────────────────────
const nav = [
  ['overview', 'Overview', '▦'],
  ['products', 'Products', '□'],
  ['orders', 'Purchase Orders', '↳'],
  ['analytics', 'Analytics', '◒'],
  ['settings', 'Settings', '◌'],
]
const ORDER_STATUSES = ['draft', 'submitted', 'approved', 'received', 'cancelled']
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const fmtCurrency = (n) => currency.format(n || 0)
const fmtNumber = (n) => new Intl.NumberFormat('en-IN').format(n || 0)
const STATUS_COLOURS = {
  draft: '#8fa3a0',
  submitted: '#3a7ca5',
  approved: '#236c67',
  received: '#275a51',
  cancelled: '#963f29',
  admin: '#8c4b26',
  manager: '#236c67',
  staff: '#3a7ca5',
}
const CHART_PALETTE = ['#236c67', '#3a8f89', '#4fb8b1', '#a5d5d1', '#c4e5e2', '#6db3ad', '#1e5551', '#82c4be']

// ─── token & theme helpers ───────────────────────────────────────────────────
const TOKEN_KEY = 'stockwise_token'
const getToken = () => localStorage.getItem(TOKEN_KEY)
const saveToken = (t) => localStorage.setItem(TOKEN_KEY, t)
const clearToken = () => localStorage.removeItem(TOKEN_KEY)

const THEME_KEY = 'stockwise_theme'
const getStoredTheme = () => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved) return saved
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
const saveTheme = (t) => {
  localStorage.setItem(THEME_KEY, t)
  document.documentElement.setAttribute('data-theme', t)
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="theme-toggle-icon">{theme === 'dark' ? '☀' : '☾'}</span>
      <span className="theme-toggle-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}

// ─── api helpers ─────────────────────────────────────────────────────────────
const authApi = (path, opts = {}) => api(path, { ...opts, token: getToken() })

// ─── small shared components ─────────────────────────────────────────────────
function Spinner({ small }) {
  return (
    <span className={small ? 'spinner spinner-sm' : 'spinner'} role="status" aria-label="Loading">
      <span />
    </span>
  )
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="toast" role="status">{message}</div>
}

function StateView({ title, message, action, onAction, icon = '□' }) {
  return (
    <div className="state">
      <span className="state-icon">{icon}</span>
      <strong>{title}</strong>
      <p>{message}</p>
      {action && <button className="primary" onClick={onAction}>{action}</button>}
    </div>
  )
}

function Modal({ title, onClose, children, wide }) {
  const ref = useRef()
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
  function handleBackdrop(e) { if (e.target === ref.current) onClose() }
  return (
    <div className="modal-backdrop" ref={ref} onClick={handleBackdrop} role="presentation">
      <section className={wide ? 'modal modal-wide' : 'modal'} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  )
}

function Badge({ status }) {
  return (
    <span className="badge" style={{ background: STATUS_COLOURS[status] + '22', color: STATUS_COLOURS[status], borderColor: STATUS_COLOURS[status] + '55' }}>
      {status}
    </span>
  )
}

function ProductSkeleton() {
  return (
    <div className="product-grid" aria-label="Loading products">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton-card" key={i}><div /><span /><span /></div>
      ))}
    </div>
  )
}

// ─── Login page ──────────────────────────────────────────────────────────────
function Login({ onLogin, theme, onToggleTheme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const quickFill = (user, pass) => {
    setEmail(user)
    setPassword(pass)
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } })
      saveToken(data.token)
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="login-card" aria-labelledby="login-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <a className="brand login-brand" href="#top" style={{ margin: 0 }}>
            <span className="brand-mark">S</span>
            <span>stockwise</span>
          </a>
          {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
        </div>
        <p className="eyebrow">INVENTORY WORKSPACE</p>
        <h1 id="login-title">Sign in to StockWise</h1>
        <p className="muted">Enter credentials or select any team member below:</p>

        <div className="demo-accounts-box">
          <p className="demo-accounts-label">Project Team Members (Click to fill):</p>
          <div className="demo-accounts-pills" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <button
              type="button"
              className="demo-pill admin"
              onClick={() => quickFill('dnyaneshwar', 'admin')}
              title="Dnyaneshwar — Admin: Full system access"
            >
              <span className="demo-pill-role">Dnyaneshwar</span>
              <span className="demo-pill-cred">Admin • id: dnyaneshwar</span>
            </button>
            <button
              type="button"
              className="demo-pill manager"
              onClick={() => quickFill('muskan', 'manager')}
              title="Muskan — Manager: Manage products & orders"
            >
              <span className="demo-pill-role">Muskan</span>
              <span className="demo-pill-cred">Manager • id: muskan</span>
            </button>
            <button
              type="button"
              className="demo-pill staff"
              onClick={() => quickFill('prajwal', 'staff')}
              title="Prajwal — Staff: View inventory & draft orders"
            >
              <span className="demo-pill-role">Prajwal</span>
              <span className="demo-pill-cred">Staff • id: prajwal</span>
            </button>
            <button
              type="button"
              className="demo-pill staff"
              onClick={() => quickFill('shushant', 'staff')}
              title="Shushant — Staff: View inventory & draft orders"
            >
              <span className="demo-pill-role">Shushant</span>
              <span className="demo-pill-cred">Staff • id: shushant</span>
            </button>
          </div>
        </div>

        <form onSubmit={submit}>
          <label>
            User ID or Email
            <input
              type="text"
              id="login-email"
              value={email}
              placeholder="e.g. dnyaneshwar, muskan, prajwal, shushant"
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              disabled={submitting}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              id="login-password"
              value={password}
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={submitting}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button id="login-submit" className="primary login-submit" disabled={submitting}>
            {submitting ? <><Spinner small /> Signing in…</> : 'Sign in'}
          </button>
        </form>
        <p className="login-note">API: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
      </section>
    </main>
  )
}

// ─── Product form (create / edit) ─────────────────────────────────────────────
function ProductForm({ product, categories, onSave, onClose }) {
  const editing = !!product
  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    sku: product?.sku || '',
    category: product?.category || (categories[0] || ''),
    description: product?.description || '',
    price: product?.price ?? '',
    stock: product?.stock ?? '',
    reorderPoint: product?.reorderPoint ?? '',
    rating: product?.rating ?? '',
    image: product?.image || '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required.'
    if (!form.brand.trim()) errs.brand = 'Brand is required.'
    if (!form.sku.trim()) errs.sku = 'SKU is required.'
    if (!form.category.trim()) errs.category = 'Category is required.'
    const price = Number(form.price)
    if (form.price === '' || isNaN(price) || price < 0) errs.price = 'Price must be 0 or more.'
    const stock = Number(form.stock)
    if (form.stock === '' || isNaN(stock) || stock < 0 || !Number.isInteger(stock)) errs.stock = 'Stock must be a whole number 0 or more.'
    const reorder = Number(form.reorderPoint)
    if (form.reorderPoint === '' || isNaN(reorder) || reorder < 0 || !Number.isInteger(reorder)) errs.reorderPoint = 'Reorder point must be a whole number 0 or more.'
    if (form.rating !== '' && (isNaN(Number(form.rating)) || Number(form.rating) < 0 || Number(form.rating) > 5)) errs.rating = 'Rating must be between 0 and 5.'
    return errs
  }

  async function submit(e) {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      reorderPoint: Number(form.reorderPoint),
      ...(form.rating !== '' ? { rating: Number(form.rating) } : {}),
      ...(form.image.trim() ? { image: form.image.trim() } : {}),
    }
    try {
      const result = editing
        ? await authApi(`/products/${product._id}`, { method: 'PATCH', body: payload })
        : await authApi('/products', { method: 'POST', body: payload })
      onSave(result.product, editing)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const Field = ({ label, id, error: fieldErr, children }) => (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {fieldErr && <span className="field-error">{fieldErr}</span>}
    </div>
  )

  return (
    <form onSubmit={submit} noValidate>
      {apiError && <p className="form-error" role="alert">{apiError}</p>}
      <div className="form-grid">
        <Field label="Product name *" id="pf-name" error={errors.name}>
          <input id="pf-name" value={form.name} onChange={e => set('name', e.target.value)} maxLength={140} disabled={submitting} />
        </Field>
        <Field label="Brand *" id="pf-brand" error={errors.brand}>
          <input id="pf-brand" value={form.brand} onChange={e => set('brand', e.target.value)} maxLength={80} disabled={submitting} />
        </Field>
        <Field label="SKU *" id="pf-sku" error={errors.sku}>
          <input id="pf-sku" value={form.sku} onChange={e => set('sku', e.target.value)} disabled={editing || submitting} placeholder="AES-RHW-500" style={{ textTransform: 'uppercase' }} />
        </Field>
        <Field label="Category *" id="pf-category" error={errors.category}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="pf-category"
              list="cat-list"
              value={form.category}
              onChange={e => set('category', e.target.value)}
              maxLength={60}
              disabled={submitting}
              style={{ flex: 1 }}
            />
            <datalist id="cat-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </Field>
        <Field label="Price (₹ INR) *" id="pf-price" error={errors.price}>
          <input id="pf-price" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Stock quantity *" id="pf-stock" error={errors.stock}>
          <input id="pf-stock" type="number" min="0" step="1" value={form.stock} onChange={e => set('stock', e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Reorder point *" id="pf-reorder" error={errors.reorderPoint}>
          <input id="pf-reorder" type="number" min="0" step="1" value={form.reorderPoint} onChange={e => set('reorderPoint', e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Rating (0–5)" id="pf-rating" error={errors.rating}>
          <input id="pf-rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set('rating', e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Image URL" id="pf-image" error={errors.image}>
          <input id="pf-image" type="url" value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://…" disabled={submitting} style={{ gridColumn: '1 / -1' }} />
        </Field>
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="pf-desc">Description</label>
          <textarea id="pf-desc" rows={3} value={form.description} onChange={e => set('description', e.target.value)} maxLength={1000} disabled={submitting} />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="secondary-btn" onClick={onClose} disabled={submitting}>Cancel</button>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? <><Spinner small /> Saving…</> : editing ? 'Save changes' : 'Add product'}
        </button>
      </div>
    </form>
  )
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, onEdit, onDelete, canManage, isAdmin }) {
  const low = product.stock <= product.reorderPoint
  const outOfStock = product.stock === 0
  return (
    <article className="product-card">
      <div className="product-image">
        {product.image
          ? <img src={product.image} alt={product.name} loading="lazy" />
          : <div className="product-image-placeholder">{product.name[0]}</div>
        }
        <span className={outOfStock ? 'stock out' : low ? 'stock low' : 'stock'}>
          {outOfStock ? 'Out of stock' : low ? `${product.stock} left — low` : `${product.stock} in stock`}
        </span>
      </div>
      <div className="product-copy">
        <p>{product.brand}</p>
        <h3>{product.name}</h3>
        <span className="sku-label">{product.sku}</span>
        {product.rating > 0 && (
          <span className="rating">★ {product.rating.toFixed(1)} <i>({Math.round(product.rating * 37)})</i></span>
        )}
        <div className="product-bottom">
          <strong>{fmtCurrency(product.price)}</strong>
          <div className="product-actions">
            {canManage && (
              <button
                className="icon-btn"
                onClick={() => onEdit(product)}
                aria-label={`Edit ${product.name}`}
                title="Edit"
              >✎</button>
            )}
            {isAdmin && (
              <button
                className="icon-btn danger"
                onClick={() => onDelete(product)}
                aria-label={`Delete ${product.name}`}
                title="Delete"
              >✕</button>
            )}
            <button
              onClick={() => onAdd(product)}
              aria-label={`Add ${product.name} to draft order`}
              disabled={outOfStock}
            >
              Add <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ─── Products page ────────────────────────────────────────────────────────────
function ProductsPage({ session, onAddToOrder }) {
  const isAdmin = session.user.role === 'admin'
  const canManage = session.user.role === 'admin' || session.user.role === 'manager'
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteProduct, setDeleteProduct] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState('')

  const notify = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 3500) }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page, limit: 12 })
      if (query) params.set('search', query)
      if (categoryFilter) params.set('category', categoryFilter)
      if (stockFilter === 'low') params.set('lowStock', 'true')
      const data = await authApi(`/products?${params}`)
      // Out-of-stock filter is client side (backend doesn't have outOfStock param)
      const items = stockFilter === 'out'
        ? data.products.filter(p => p.stock === 0)
        : data.products
      setProducts(items)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [query, categoryFilter, stockFilter, page])

  useEffect(() => {
    authApi('/products/categories').then(d => setCategories(d.categories || [])).catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [query, categoryFilter, stockFilter])
  useEffect(() => { load() }, [load])

  function handleSaved(savedProduct, wasEditing) {
    setShowForm(false)
    setEditProduct(null)
    notify(wasEditing ? `${savedProduct.name} updated.` : `${savedProduct.name} added to catalogue.`)
    load()
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await authApi(`/products/${deleteProduct._id}`, { method: 'DELETE' })
      notify(`${deleteProduct.name} removed from catalogue.`)
      setDeleteProduct(null)
      load()
    } catch (err) {
      notify(`Could not delete: ${err.message}`)
      setDeleteProduct(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="page-controls">
        <div className="filter-row">
          <div className="search-inline">
            <span aria-hidden="true">⌕</span>
            <input
              id="product-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search name, SKU, brand…"
            />
          </div>
          <label className="sr-only" htmlFor="cat-filter">Category</label>
          <select id="cat-filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="sr-only" htmlFor="stock-filter">Stock status</label>
          <select id="stock-filter" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
            <option value="">All stock levels</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          {(query || categoryFilter || stockFilter) && (
            <button className="text-button" onClick={() => { setQuery(''); setCategoryFilter(''); setStockFilter('') }}>
              Clear filters
            </button>
          )}
        </div>
        {canManage && (
          <button className="primary" onClick={() => { setEditProduct(null); setShowForm(true) }}>
            Add product <span aria-hidden="true">+</span>
          </button>
        )}
      </div>

      {loading ? (
        <ProductSkeleton />
      ) : error ? (
        <StateView
          title="Could not load products"
          message={error}
          action="Try again"
          onAction={load}
          icon="⚠"
        />
      ) : products.length === 0 ? (
        <StateView
          title="No products found"
          message={query || categoryFilter || stockFilter
            ? 'Try a different search term or clear the filters.'
            : 'Your catalogue is empty. Add your first product to get started.'
          }
          action={canManage ? 'Add first product' : undefined}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          <p className="result-count">{fmtNumber(pagination.total)} product{pagination.total !== 1 ? 's' : ''}</p>
          <div className="product-grid">
            {products.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                onAdd={onAddToOrder}
                onEdit={(p) => { setEditProduct(p); setShowForm(true) }}
                onDelete={setDeleteProduct}
                canManage={canManage}
                isAdmin={isAdmin}
              />
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="secondary-btn">← Previous</button>
              <span>Page {page} of {pagination.pages}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="secondary-btn">Next →</button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <Modal
          title={editProduct ? `Edit — ${editProduct.name}` : 'Add new product'}
          onClose={() => { setShowForm(false); setEditProduct(null) }}
          wide
        >
          <ProductForm
            product={editProduct}
            categories={categories}
            onSave={handleSaved}
            onClose={() => { setShowForm(false); setEditProduct(null) }}
          />
        </Modal>
      )}

      {deleteProduct && (
        <Modal title="Delete product" onClose={() => setDeleteProduct(null)}>
          <div className="confirm-body">
            <p>Are you sure you want to permanently delete <strong>{deleteProduct.name}</strong>?</p>
            <p className="muted">This cannot be undone. Existing purchase order lines will keep the product name for reference.</p>
            <div className="form-actions">
              <button className="secondary-btn" onClick={() => setDeleteProduct(null)} disabled={deleting}>Cancel</button>
              <button className="danger-btn" onClick={confirmDelete} disabled={deleting}>
                {deleting ? <><Spinner small /> Deleting…</> : 'Yes, delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

// ─── Draft order (cart) panel ─────────────────────────────────────────────────
function DraftOrder({ items, subtotal, onClose, onChange, onSubmitted, session }) {
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [complete, setComplete] = useState(null)

  async function sendOrder() {
    if (!items.length) return
    setApiError('')
    setSubmitting(true)
    try {
      const payload = {
        supplier: supplier.trim() || 'Unassigned supplier',
        notes: notes.trim(),
        items: items.map(item => ({ productId: item._id, quantity: item.quantity })),
      }
      const data = await authApi('/orders', { method: 'POST', body: payload })
      setComplete(data.order)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDone() {
    onSubmitted()
    onClose()
  }

  const qty = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="cart-backdrop" role="presentation">
      <section className="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header>
          <div>
            <p className="eyebrow">PURCHASING</p>
            <h2 id="cart-title">Draft order</h2>
          </div>
          <button className="close" onClick={onClose} aria-label="Close draft order">×</button>
        </header>

        {complete ? (
          <div className="checkout-state">
            <span>✓</span>
            <h3>Order created</h3>
            <p>
              <strong>{complete.number}</strong> has been saved as a draft.
              You can track it under Purchase Orders.
            </p>
            <button className="primary" onClick={handleDone}>Done</button>
          </div>
        ) : items.length ? (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div className="cart-item" key={item._id}>
                  {item.image
                    ? <img src={item.image} alt="" />
                    : <div className="cart-item-placeholder">{item.name[0]}</div>
                  }
                  <div>
                    <strong>{item.name}</strong>
                    <span>{fmtCurrency(item.price)} each</span>
                    <div className="quantity">
                      <button onClick={() => onChange(item._id, -1)} aria-label={`Decrease ${item.name}`}>−</button>
                      <b>{item.quantity}</b>
                      <button onClick={() => onChange(item._id, 1)} aria-label={`Increase ${item.name}`}>+</button>
                    </div>
                  </div>
                  <b>{fmtCurrency(item.price * item.quantity)}</b>
                </div>
              ))}
            </div>
            <div className="cart-form">
              <label htmlFor="co-supplier">Supplier name</label>
              <input id="co-supplier" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier Co." />
              <label htmlFor="co-notes">Notes</label>
              <textarea id="co-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional delivery notes…" />
            </div>
            {apiError && <p className="form-error" role="alert">{apiError}</p>}
            <div className="cart-summary">
              <span>Subtotal <b>{fmtCurrency(subtotal)}</b></span>
              <small>{qty} item{qty !== 1 ? 's' : ''} — taxes and shipping calculated before approval.</small>
              <button className="primary full" onClick={sendOrder} disabled={submitting}>
                {submitting ? <><Spinner small /> Creating order…</> : 'Create purchase order'}
              </button>
            </div>
          </>
        ) : (
          <div className="checkout-state">
            <span>□</span>
            <h3>Draft is empty</h3>
            <p>Add products from the catalogue to begin a purchase order.</p>
            <button className="primary" onClick={onClose}>Browse products</button>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Orders page ──────────────────────────────────────────────────────────────
function OrdersPage({ session, refreshTrigger }) {
  const isAdmin = session.user.role === 'admin'
  const canManageOrders = session.user.role === 'admin' || session.user.role === 'manager'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [statusChange, setStatusChange] = useState({ id: null, loading: false })
  const [notice, setNotice] = useState('')

  const notify = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 3500) }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const data = await authApi(`/orders${statusFilter ? `?${params}` : ''}`)
      setOrders(data.orders)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load, refreshTrigger])

  async function changeStatus(orderId, newStatus) {
    setStatusChange({ id: orderId, loading: true })
    try {
      const data = await authApi(`/orders/${orderId}/status`, { method: 'PATCH', body: { status: newStatus } })
      setOrders(prev => prev.map(o => o._id === orderId ? data.order : o))
      notify(`Order status changed to "${newStatus}".`)
    } catch (err) {
      notify(`Could not update status: ${err.message}`)
    } finally {
      setStatusChange({ id: null, loading: false })
    }
  }

  const nextStatuses = (current) => {
    const allowed = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'cancelled'],
      approved: ['received', 'cancelled'],
      received: [],
      cancelled: [],
    }
    return allowed[current] || []
  }

  return (
    <div>
      <div className="page-controls">
        <label className="sr-only" htmlFor="status-filter">Filter by status</label>
        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ marginLeft: 0 }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="text-button" onClick={load}>↺ Refresh</button>
      </div>

      {loading ? (
        <div className="loading-block"><Spinner /> <span>Loading orders…</span></div>
      ) : error ? (
        <StateView title="Could not load orders" message={error} action="Try again" onAction={load} icon="⚠" />
      ) : orders.length === 0 ? (
        <StateView
          title="No purchase orders yet"
          message={statusFilter ? `No orders with status "${statusFilter}".` : 'Create a draft order from the Products page using the cart button.'}
        />
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const expanded = expandedId === order._id
            const isChanging = statusChange.id === order._id && statusChange.loading
            const nextOpts = nextStatuses(order.status)
            return (
              <div className="order-row panel" key={order._id}>
                <div className="order-summary" onClick={() => setExpandedId(expanded ? null : order._id)}>
                  <div>
                    <strong className="order-number">{order.number}</strong>
                    <span className="muted order-supplier">{order.supplier}</span>
                  </div>
                  <div className="order-meta">
                    <Badge status={order.status} />
                    <span className="order-amount">{fmtCurrency(order.subtotal)}</span>
                    <span className="muted order-date">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="order-expand">{expanded ? '▴' : '▾'}</span>
                  </div>
                </div>
                {expanded && (
                  <div className="order-detail">
                    <table className="order-table">
                      <thead>
                        <tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit price</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, i) => (
                          <tr key={i}>
                            <td>{item.name}</td>
                            <td><code>{item.sku}</code></td>
                            <td>{item.quantity}</td>
                            <td>{fmtCurrency(item.unitPrice)}</td>
                            <td>{fmtCurrency(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {order.notes && <p className="order-notes"><strong>Notes:</strong> {order.notes}</p>}
                    <div className="order-footer-row">
                      <div>
                        {order.createdBy && (
                          <span className="muted">Created by {order.createdBy.name}</span>
                        )}
                      </div>
                      {canManageOrders && nextOpts.length > 0 && (
                        <div className="status-actions">
                          <span className="muted">Move to:</span>
                          {nextOpts.map(s => (
                            <button
                              key={s}
                              className="status-btn"
                              style={{ borderColor: STATUS_COLOURS[s], color: STATUS_COLOURS[s] }}
                              onClick={() => changeStatus(order._id, s)}
                              disabled={isChanging}
                            >
                              {isChanging ? <Spinner small /> : s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

// ─── Analytics page ───────────────────────────────────────────────────────────
const CUSTOM_TOOLTIP_STYLE = {
  background: '#fffefa', border: '1px solid #dce2df', borderRadius: 6,
  padding: '8px 12px', fontSize: 12, color: '#192725'
}

function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await authApi('/dashboard/analytics')
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="loading-block"><Spinner /> <span>Loading analytics…</span></div>
  if (error) return <StateView title="Could not load analytics" message={error} action="Try again" onAction={load} icon="⚠" />
  if (!data || !data.byCategory?.length) {
    return <StateView title="No data yet" message="Add products to your catalogue to see inventory analytics." />
  }

  const { byCategory, totals } = data
  const valueData = byCategory.map((c, i) => ({ name: c.category, value: c.inventoryValue, fill: CHART_PALETTE[i % CHART_PALETTE.length] }))
  const unitsData = byCategory.map((c, i) => ({ name: c.category, value: c.totalUnits, fill: CHART_PALETTE[i % CHART_PALETTE.length] }))
  const countData = byCategory.map((c, i) => ({ name: c.category, value: c.productCount, fill: CHART_PALETTE[i % CHART_PALETTE.length] }))

  const fmtTick = (v) => fmtCurrency(v).replace(',000', 'k').replace(',', '.')

  return (
    <div className="analytics-page">
      {/* Summary metrics */}
      <section className="metrics" aria-label="Inventory totals">
        <article className="metric">
          <p>Total inventory value</p>
          <strong>{fmtCurrency(totals.totalValue)}</strong>
          <span>{fmtNumber(totals.totalProducts)} products</span>
        </article>
        <article className="metric">
          <p>Total units in stock</p>
          <strong>{fmtNumber(totals.totalUnits)}</strong>
          <span>Across {byCategory.length} categories</span>
        </article>
        <article className="metric">
          <p>Low stock products</p>
          <strong>{fmtNumber(totals.lowStock)}</strong>
          <span className={totals.lowStock > 0 ? 'warning' : ''}>{totals.lowStock > 0 ? '● Needs attention' : '✓ All good'}</span>
        </article>
        <article className="metric">
          <p>Out of stock</p>
          <strong>{fmtNumber(totals.outOfStock)}</strong>
          <span className={totals.outOfStock > 0 ? 'warning' : ''}>{totals.outOfStock > 0 ? '● Requires action' : '✓ None'}</span>
        </article>
      </section>

      <div className="analytics-charts">
        {/* Inventory value by category */}
        <div className="panel analytics-chart-panel">
          <div className="panel-head">
            <div>
              <h2>Inventory value by category</h2>
              <p>Current stock × unit price</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={valueData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e9e6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64716e' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtTick} tick={{ fontSize: 10, fill: '#64716e' }} axisLine={false} tickLine={false} width={56} />
                <Tooltip
                  formatter={(v) => [fmtCurrency(v), 'Inventory value']}
                  contentStyle={CUSTOM_TOOLTIP_STYLE}
                  cursor={{ fill: '#f0f4f2' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {valueData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Units by category */}
        <div className="panel analytics-chart-panel">
          <div className="panel-head">
            <div>
              <h2>Units in stock by category</h2>
              <p>Total quantity per category</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={unitsData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e9e6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64716e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64716e' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(v) => [fmtNumber(v), 'Units']}
                  contentStyle={CUSTOM_TOOLTIP_STYLE}
                  cursor={{ fill: '#f0f4f2' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {unitsData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product count by category */}
        <div className="panel analytics-chart-panel">
          <div className="panel-head">
            <div>
              <h2>Products per category</h2>
              <p>How many SKUs each category holds</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={countData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e9e6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64716e' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64716e' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(v) => [v, 'Products']}
                  contentStyle={CUSTOM_TOOLTIP_STYLE}
                  cursor={{ fill: '#f0f4f2' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {countData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="panel" style={{ marginTop: 22 }}>
        <div className="panel-head" style={{ marginBottom: 16 }}>
          <div>
            <h2>Category breakdown</h2>
            <p>Detailed view of each category</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Products</th>
                <th className="num">Units</th>
                <th className="num">Inventory value</th>
                <th className="num">Low stock</th>
                <th className="num">Out of stock</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map((c, i) => (
                <tr key={c.category}>
                  <td>
                    <span className="cat-dot" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                    {c.category}
                  </td>
                  <td className="num">{c.productCount}</td>
                  <td className="num">{fmtNumber(c.totalUnits)}</td>
                  <td className="num">{fmtCurrency(c.inventoryValue)}</td>
                  <td className="num">{c.lowStockCount > 0 ? <span className="warning">{c.lowStockCount}</span> : 0}</td>
                  <td className="num">{c.outOfStockCount > 0 ? <span className="warning">{c.outOfStockCount}</span> : 0}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td className="num"><strong>{totals.totalProducts}</strong></td>
                <td className="num"><strong>{fmtNumber(totals.totalUnits)}</strong></td>
                <td className="num"><strong>{fmtCurrency(totals.totalValue)}</strong></td>
                <td className="num">{totals.lowStock > 0 ? <span className="warning"><strong>{totals.lowStock}</strong></span> : <strong>0</strong>}</td>
                <td className="num">{totals.outOfStock > 0 ? <span className="warning"><strong>{totals.outOfStock}</strong></span> : <strong>0</strong>}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Settings page ────────────────────────────────────────────────────────────
function SettingsPage({ session, onLogout }) {
  const isAdmin = session.user.role === 'admin'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [notice, setNotice] = useState('')

  const notify = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 3500) }

  async function createUser(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setApiError('Name, email, and password are required.')
      return
    }
    setApiError('')
    setSubmitting(true)
    try {
      await authApi('/auth/users', { method: 'POST', body: form })
      notify(`User ${form.email} created as ${form.role}.`)
      setForm({ name: '', email: '', password: '', role: 'staff' })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="settings-grid">
        {/* Account info */}
        <div className="panel">
          <h2 style={{ marginBottom: 18 }}>Your account</h2>
          <div className="account-info-row">
            <span className="avatar big-avatar">{session.user.name.split(' ').map(p => p[0]).join('').slice(0, 2)}</span>
            <div>
              <strong>{session.user.name}</strong>
              <p className="muted">{session.user.email}</p>
              <p className="muted" style={{ marginTop: 4 }}>Role: <Badge status={session.user.role} /></p>
            </div>
          </div>
          <button className="danger-btn" style={{ marginTop: 22 }} onClick={onLogout}>Sign out</button>
        </div>

        {/* Create user — admin only */}
        {isAdmin && (
          <div className="panel">
            <h2 style={{ marginBottom: 4 }}>Create new user</h2>
            <p className="muted" style={{ marginBottom: 18 }}>
              Only administrators can create workspace accounts.
            </p>
            <form onSubmit={createUser}>
              {apiError && <p className="form-error" role="alert">{apiError}</p>}
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="nu-name">Full name</label>
                  <input id="nu-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-field">
                  <label htmlFor="nu-email">Email address</label>
                  <input id="nu-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-field">
                  <label htmlFor="nu-pass">Password (min 3 chars)</label>
                  <input id="nu-pass" type="password" minLength={3} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-field">
                  <label htmlFor="nu-role">Role</label>
                  <select id="nu-role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={submitting}>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: 18 }}>
                <button type="submit" className="primary" disabled={submitting}>
                  {submitting ? <><Spinner small /> Creating…</> : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

// ─── Dashboard (overview) page ────────────────────────────────────────────────
function DashboardPage({ session }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await authApi('/dashboard/summary')
      setSummary(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <>
        <section className="metrics" aria-label="Loading inventory summary">
          {[1, 2, 3, 4].map(i => (
            <article className="metric" key={i}>
              <div className="skeleton-line" style={{ width: '60%', height: 12 }} />
              <div className="skeleton-line" style={{ width: '80%', height: 28, margin: '14px 0 10px' }} />
              <div className="skeleton-line" style={{ width: '40%', height: 10 }} />
            </article>
          ))}
        </section>
        <div className="loading-block"><Spinner /> <span>Loading dashboard…</span></div>
      </>
    )
  }

  if (error) {
    return (
      <StateView
        title="Could not load dashboard"
        message={error}
        action="Try again"
        onAction={load}
        icon="⚠"
      />
    )
  }

  const { inventory, lowStock, openOrders } = summary || {}
  const lowCount = inventory?.lowStockCount ?? lowStock?.length ?? 0

  return (
    <>
      <section className="metrics" aria-label="Inventory summary">
        <article className="metric">
          <p>Inventory value</p>
          <strong>{fmtCurrency(inventory?.value)}</strong>
          <span>{fmtNumber(inventory?.products)} active products</span>
        </article>
        <article className="metric">
          <p>Units in stock</p>
          <strong>{fmtNumber(inventory?.units)}</strong>
          <span>Across all categories</span>
        </article>
        <article className="metric">
          <p>Low stock items</p>
          <strong>{fmtNumber(lowCount)}</strong>
          <span className={lowCount > 0 ? 'warning' : ''}>
            {lowCount > 0 ? '● Requires attention' : '✓ All good'}
          </span>
        </article>
        <article className="metric">
          <p>Open purchase orders</p>
          <strong>{fmtNumber(openOrders)}</strong>
          <span>{openOrders > 0 ? 'Draft, submitted, or approved' : 'No open orders'}</span>
        </article>
      </section>

      <section className="dashboard-grid">
        {/* Inventory value chart */}
        <InventoryValueChart />

        {/* Low-stock attention panel */}
        <div className="panel attention">
          <div className="panel-head">
            <div>
              <h2>Needs attention</h2>
              <p>Stock at or below reorder point</p>
            </div>
          </div>
          {!lowStock?.length ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#64716e' }}>
              <span style={{ fontSize: 24 }}>✓</span>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>All products are above their reorder point.</p>
            </div>
          ) : (
            lowStock.slice(0, 5).map(item => (
              <div className="attention-row" key={item._id}>
                {item.image
                  ? <img src={item.image} alt="" loading="lazy" />
                  : <div className="attention-placeholder">{item.name[0]}</div>
                }
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.sku}</span>
                </div>
                <div>
                  <b>{item.stock} left</b>
                  <small>Reorder at {item.reorderPoint}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  )
}

// Small inline chart on the dashboard showing inventory value by category
function InventoryValueChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi('/dashboard/analytics')
      .then(d => setData(d.byCategory || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="panel sales-panel">
      <div className="panel-head"><div><h2>Inventory value by category</h2><p>Loading…</p></div></div>
      <div style={{ height: 238, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    </div>
  )

  if (!data.length) return (
    <div className="panel sales-panel">
      <div className="panel-head"><div><h2>Inventory value by category</h2><p>No data</p></div></div>
      <div style={{ height: 238, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64716e', fontSize: 13 }}>
        Add products to see inventory analytics.
      </div>
    </div>
  )

  const chartData = data.map((c, i) => ({
    name: c.category,
    value: c.inventoryValue,
    fill: CHART_PALETTE[i % CHART_PALETTE.length]
  }))

  return (
    <div className="panel sales-panel">
      <div className="panel-head">
        <div>
          <h2>Inventory value by category</h2>
          <p>Current stock × unit price — real database values</p>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e9e6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64716e' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => fmtCurrency(v).replace(',000', 'k')}
              tick={{ fontSize: 9, fill: '#64716e' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              formatter={(v) => [fmtCurrency(v), 'Value']}
              contentStyle={CUSTOM_TOOLTIP_STYLE}
              cursor={{ fill: '#f0f4f2' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Legal modal ──────────────────────────────────────────────────────────────
function Legal({ type, onClose }) {
  const terms = type === 'terms'
  return (
    <div className="legal-backdrop">
      <section className="legal" role="dialog" aria-modal="true" aria-labelledby="legal-title">
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">STOCKWISE</p>
        <h2 id="legal-title">{terms ? 'Terms of Service' : 'Privacy Policy'}</h2>
        <p>
          {terms
            ? 'StockWise is provided as an inventory workspace for authorized business users. You are responsible for the accuracy of catalogue and purchasing data entered under your account.'
            : 'StockWise uses account and inventory information only to operate the service. We do not sell personal information. Access is limited to authorized workspace members.'
          }
        </p>
        <p>
          {terms
            ? "Do not use the service to submit unlawful content or attempt to access another organization's information."
            : 'Questions about data access or deletion can be directed to your workspace administrator.'
          }
        </p>
        <button className="primary" onClick={onClose}>Close</button>
      </section>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')
  const [draftItems, setDraftItems] = useState([])
  const [draftOpen, setDraftOpen] = useState(false)
  const [legal, setLegal] = useState(null)
  const [orderRefreshTrigger, setOrderRefreshTrigger] = useState(0)
  const [theme, setTheme] = useState(() => getStoredTheme())

  useEffect(() => {
    saveTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  // Restore session from token
  useEffect(() => {
    const token = getToken()
    if (!token) { setAuthLoading(false); return }
    api('/auth/me', { token })
      .then(({ user }) => setSession({ token, user }))
      .catch(() => clearToken())
      .finally(() => setAuthLoading(false))
  }, [])

  function logout() {
    clearToken()
    setSession(null)
    setDraftItems([])
    setActive('overview')
  }

  function addToOrder(product) {
    setDraftItems(items => {
      const found = items.find(i => i._id === product._id)
      return found
        ? items.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...items, { ...product, quantity: 1 }]
    })
    setActive('products')
  }

  function changeDraftQty(id, delta) {
    setDraftItems(items =>
      items.map(i => i._id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter(i => i.quantity > 0)
    )
  }

  function handleOrderSubmitted() {
    setDraftItems([])
    setOrderRefreshTrigger(t => t + 1)
  }

  const draftQty = draftItems.reduce((s, i) => s + i.quantity, 0)
  const draftSubtotal = draftItems.reduce((s, i) => s + i.quantity * i.price, 0)

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-loading"><Spinner /> <span>Checking your session…</span></div>
      </div>
    )
  }

  if (!session) {
    return <Login onLogin={(data) => setSession(data)} theme={theme} onToggleTheme={toggleTheme} />
  }

  const isAdmin = session.user.role === 'admin'
  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = session.user.name.split(' ')[0]

  function renderPage() {
    switch (active) {
      case 'overview':
        return <DashboardPage session={session} />
      case 'products':
        return (
          <ProductsPage
            session={session}
            onAddToOrder={addToOrder}
            globalQuery={globalQuery}
          />
        )
      case 'orders':
        return <OrdersPage session={session} refreshTrigger={orderRefreshTrigger} />
      case 'analytics':
        return <AnalyticsPage />
      case 'settings':
        return <SettingsPage session={session} onLogout={logout} />
      default:
        return null
    }
  }

  const pageTitle = active === 'overview'
    ? `${greeting}, ${firstName}.`
    : nav.find(([id]) => id === active)?.[1] || ''

  const pageSubtitle = active === 'overview'
    ? 'Here is what needs your attention today.'
    : 'Manage your store operations from one focused workspace.'

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="StockWise home" onClick={() => setSidebarOpen(false)}>
          <span className="brand-mark">S</span>
          <span>stockwise</span>
        </a>
        <nav>
          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={active === id ? 'nav-link active' : 'nav-link'}
              onClick={() => { setActive(id); setSidebarOpen(false) }}
            >
              <span className="nav-symbol" aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="help">
            <strong>Need a hand?</strong>
            <span>Read the inventory guide</span>
          </div>
          <button
            className="account"
            onClick={logout}
            title="Sign out of StockWise"
          >
            <span className="avatar">
              {session.user.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
            </span>
            <span>
              <strong>{session.user.name}</strong>
              <small>{session.user.role}</small>
            </span>
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
      </aside>

      <main id="top">
        {/* Top bar */}
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(o => !o)}
          >
            ☰
          </button>
          <div className="search">
            <label htmlFor="global-search" className="sr-only">Search inventory</label>
            <span aria-hidden="true">⌕</span>
            <input
              id="global-search"
              value={globalQuery}
              onChange={(e) => {
                setGlobalQuery(e.target.value)
                if (e.target.value) setActive('products')
              }}
              placeholder="Search products, SKU or brand"
            />
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button className="notification" aria-label="Notifications">◔<span /></button>
          <button
            className="cart-button"
            onClick={() => setDraftOpen(true)}
            aria-label={`Open draft order with ${draftQty} items`}
          >
            Draft order <b>{draftQty}</b>
          </button>
        </header>

        <div className="content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">INVENTORY CONTROL</p>
              <h1>{pageTitle}</h1>
              <p className="muted">{pageSubtitle}</p>
            </div>
            {isAdmin && active !== 'settings' && active !== 'analytics' && (
              <button className="primary" onClick={() => setActive('products')}>
                Add product <span aria-hidden="true">+</span>
              </button>
            )}
          </section>

          {renderPage()}
        </div>

        <footer>
          <span>© 2026 StockWise — Developed by <strong>Dnyaneshwar, Muskan, Prajwal, Shushant</strong></span>
          <button onClick={() => setLegal('terms')}>Terms of Service</button>
          <button onClick={() => setLegal('privacy')}>Privacy Policy</button>
        </footer>
      </main>

      {/* Draft order drawer */}
      {draftOpen && (
        <DraftOrder
          items={draftItems}
          subtotal={draftSubtotal}
          onClose={() => setDraftOpen(false)}
          onChange={changeDraftQty}
          onSubmitted={handleOrderSubmitted}
          session={session}
        />
      )}

      {/* Legal modal */}
      {legal && <Legal type={legal} onClose={() => setLegal(null)} />}
    </div>
  )
}
