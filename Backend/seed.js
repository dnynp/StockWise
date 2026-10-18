import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from './src/models/User.js'
import Product from './src/models/Product.js'
import PurchaseOrder from './src/models/PurchaseOrder.js'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPaths = [
  path.join(process.cwd(), 'Backend', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env')
]
for (const p of envPaths) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); break }
}
if (!process.env.MONGODB_URI) dotenv.config()

// College Project Team Members: Dnyaneshwar, Muskan, Prajwal, Shushant
const users = [
  {
    name: 'Dnyaneshwar (Admin)',
    username: 'dnyaneshwar',
    email: 'dnyaneshwar@stockwise.com',
    password: 'admin',
    role: 'admin'
  },
  {
    name: 'Muskan (Manager)',
    username: 'muskan',
    email: 'muskan@stockwise.com',
    password: 'manager',
    role: 'manager'
  },
  {
    name: 'Prajwal (Staff)',
    username: 'prajwal',
    email: 'prajwal@stockwise.com',
    password: 'staff',
    role: 'staff'
  },
  {
    name: 'Shushant (Staff)',
    username: 'shushant',
    email: 'shushant@stockwise.com',
    password: 'staff',
    role: 'staff'
  },
  // Convenience aliases for generic demo logins
  {
    name: 'Dnyaneshwar (Admin)',
    username: 'admin',
    email: 'admin@stockwise.com',
    password: 'admin',
    role: 'admin'
  },
  {
    name: 'Muskan (Manager)',
    username: 'manager',
    email: 'manager@stockwise.com',
    password: 'manager',
    role: 'manager'
  },
  {
    name: 'Prajwal (Staff)',
    username: 'staff',
    email: 'staff@stockwise.com',
    password: 'staff',
    role: 'staff'
  },
  {
    name: 'StockWise Admin',
    username: 'admin-local',
    email: 'admin@stockwise.local',
    password: 'admin',
    role: 'admin'
  }
]

// Product catalog with prices in INR (₹)
const products = [
  {
    name: 'Aesop Resurrection Hand Wash',
    brand: 'Aesop',
    sku: 'AES-RHW-500',
    category: 'Personal care',
    description: 'Gentle exfoliating hand wash with mandarin rind, rosemary leaf, and cedar atlas.',
    price: 1299,
    stock: 42,
    reorderPoint: 18,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Hario V60 Drip Decanter',
    brand: 'Hario',
    sku: 'HAR-V60-700',
    category: 'Coffee',
    description: 'Heat-resistant borosilicate glass server with removable silicone band and 02 dripper.',
    price: 1850,
    stock: 8,
    reorderPoint: 12,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Merino Travel Throw',
    brand: 'Sage & Loom',
    sku: 'SAL-MTT-01',
    category: 'Home',
    description: '100% superfine Australian merino wool throw blanket, woven in Melbourne.',
    price: 3499,
    stock: 25,
    reorderPoint: 10,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1583845112203-454c8d57f4d8?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Everyday Carry Tote',
    brand: 'Bagsmith',
    sku: 'BAG-ECT-02',
    category: 'Accessories',
    description: 'Heavyweight waxed organic cotton canvas tote with vegetable-tanned leather straps.',
    price: 2199,
    stock: 5,
    reorderPoint: 10,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Stoneware Mug Set',
    brand: 'Mud Australia',
    sku: 'MUD-SWM-04',
    category: 'Home',
    description: 'Set of 4 handmade porcelain ceramic mugs with matte exterior and glazed interior.',
    price: 1499,
    stock: 17,
    reorderPoint: 8,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Linen Notebook, Olive',
    brand: 'Appointed',
    sku: 'APP-LNO-01',
    category: 'Stationery',
    description: 'Bookcloth hard cover journal with brass wire-o binding and smooth 70lb text paper.',
    price: 699,
    stock: 56,
    reorderPoint: 20,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Baratza Encore Coffee Grinder',
    brand: 'Baratza',
    sku: 'BAR-ENC-40',
    category: 'Coffee',
    description: 'Precision 40mm conical burr coffee grinder with 40 grind adjustment settings.',
    price: 8999,
    stock: 14,
    reorderPoint: 6,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Cedar & Amber Scented Candle',
    brand: 'P.F. Candle Co.',
    sku: 'PFC-CAC-08',
    category: 'Home',
    description: 'Hand-poured 100% domestic soy wax candle in signature amber glass jar.',
    price: 799,
    stock: 3,
    reorderPoint: 15,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Minimalist Brass Desk Pen',
    brand: 'Karas Kustoms',
    sku: 'KAR-BDP-09',
    category: 'Stationery',
    description: 'Solid machined brass rollerball pen with Schmidt ceramic roller refill.',
    price: 1199,
    stock: 22,
    reorderPoint: 10,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Botanical Facial Oil',
    brand: 'Herbivore',
    sku: 'HRB-BFO-50',
    category: 'Personal care',
    description: 'Balancing blue tansy and jasmine face oil for clarifying and nourishing skin.',
    price: 1999,
    stock: 0,
    reorderPoint: 8,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Canvas Weekender Duffel',
    brand: 'Bellroy',
    sku: 'BEL-CWD-30',
    category: 'Accessories',
    description: 'Water-resistant recycled ripstop weekend travel bag with clean internal organization.',
    price: 4499,
    stock: 12,
    reorderPoint: 5,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85'
  },
  {
    name: 'Acoustic Desk Lamp',
    brand: 'Muuto',
    sku: 'MUU-ADL-12',
    category: 'Home',
    description: 'Warm LED task lamp crafted with pressed felt shade for sound-dampening ambiance.',
    price: 3899,
    stock: 7,
    reorderPoint: 8,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=85'
  }
]

async function seed() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in Backend/.env')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB.')

    // 1. Seed or update Users
    const seededUsers = {}
    for (const u of users) {
      let existing = await User.findOne({ email: u.email })
      if (!existing && u.username) {
        existing = await User.findOne({ username: u.username })
      }
      if (existing) {
        existing.name = u.name
        existing.username = u.username
        existing.role = u.role
        existing.password = u.password // Will trigger pre-save bcrypt hash
        await existing.save()
        seededUsers[u.username] = existing
      } else {
        const created = await User.create(u)
        seededUsers[u.username] = created
      }
    }
    console.log('Seeded Users for project team:')
    console.log(' - Dnyaneshwar (Admin):   ID "dnyaneshwar" (or "admin")   / Pass "admin"')
    console.log(' - Muskan (Manager):      ID "muskan"      (or "manager") / Pass "manager"')
    console.log(' - Prajwal (Staff):       ID "prajwal"     (or "staff")   / Pass "staff"')
    console.log(' - Shushant (Staff):      ID "shushant"    (or "staff")   / Pass "staff"')

    // 2. Seed Products
    await Product.bulkWrite(
      products.map((product) => ({
        updateOne: {
          filter: { sku: product.sku },
          update: { $set: product },
          upsert: true
        }
      }))
    )
    console.log(`Seeded ${products.length} products with INR (₹) prices across multiple categories.`)

    // 3. Seed Purchase Orders with realistic INR amounts and team members
    const allProducts = await Product.find({})
    const prodMap = {}
    allProducts.forEach(p => { prodMap[p.sku] = p })

    const dnyaneshwar = seededUsers['dnyaneshwar'] || seededUsers['admin']
    const muskan = seededUsers['muskan'] || seededUsers['manager']
    const prajwal = seededUsers['prajwal'] || seededUsers['staff']
    const shushant = seededUsers['shushant'] || prajwal

    const sampleOrders = [
      {
        number: 'PO-2026-001',
        supplier: 'Hario Global Distribution',
        status: 'received',
        createdBy: dnyaneshwar._id,
        notes: 'Monthly standard replenishment order approved and received.',
        items: [
          {
            product: prodMap['HAR-V60-700']?._id || allProducts[0]._id,
            name: 'Hario V60 Drip Decanter',
            sku: 'HAR-V60-700',
            quantity: 15,
            unitPrice: 1850
          },
          {
            product: prodMap['BAR-ENC-40']?._id || allProducts[1]._id,
            name: 'Baratza Encore Coffee Grinder',
            sku: 'BAR-ENC-40',
            quantity: 4,
            unitPrice: 8999
          }
        ],
        subtotal: 15 * 1850 + 4 * 8999
      },
      {
        number: 'PO-2026-002',
        supplier: 'Aesop Apothecary Supply',
        status: 'approved',
        createdBy: muskan._id,
        notes: 'Urgent restock for hand wash and botanicals reviewed by Muskan.',
        items: [
          {
            product: prodMap['AES-RHW-500']?._id || allProducts[0]._id,
            name: 'Aesop Resurrection Hand Wash',
            sku: 'AES-RHW-500',
            quantity: 25,
            unitPrice: 1299
          },
          {
            product: prodMap['HRB-BFO-50']?._id || allProducts[2]._id,
            name: 'Botanical Facial Oil',
            sku: 'HRB-BFO-50',
            quantity: 15,
            unitPrice: 1999
          }
        ],
        subtotal: 25 * 1299 + 15 * 1999
      },
      {
        number: 'PO-2026-003',
        supplier: 'Sage & Loom Textiles',
        status: 'submitted',
        createdBy: prajwal._id,
        notes: 'Replenishing low-stock seasonal home goods prepared by Prajwal.',
        items: [
          {
            product: prodMap['SAL-MTT-01']?._id || allProducts[0]._id,
            name: 'Merino Travel Throw',
            sku: 'SAL-MTT-01',
            quantity: 8,
            unitPrice: 3499
          },
          {
            product: prodMap['MUD-SWM-04']?._id || allProducts[1]._id,
            name: 'Stoneware Mug Set',
            sku: 'MUD-SWM-04',
            quantity: 10,
            unitPrice: 1499
          }
        ],
        subtotal: 8 * 3499 + 10 * 1499
      },
      {
        number: 'PO-2026-004',
        supplier: 'Appointed Paper Craft Co.',
        status: 'draft',
        createdBy: shushant._id,
        notes: 'Draft order created by Shushant for stationery restock.',
        items: [
          {
            product: prodMap['APP-LNO-01']?._id || allProducts[0]._id,
            name: 'Linen Notebook, Olive',
            sku: 'APP-LNO-01',
            quantity: 30,
            unitPrice: 699
          },
          {
            product: prodMap['KAR-BDP-09']?._id || allProducts[1]._id,
            name: 'Minimalist Brass Desk Pen',
            sku: 'KAR-BDP-09',
            quantity: 15,
            unitPrice: 1199
          }
        ],
        subtotal: 30 * 699 + 15 * 1199
      }
    ]

    for (const ord of sampleOrders) {
      await PurchaseOrder.updateOne(
        { number: ord.number },
        { $set: ord },
        { upsert: true }
      )
    }
    console.log(`Seeded ${sampleOrders.length} purchase orders with createdBy assigned to team members.`)

    console.log('\nSeed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seed()
