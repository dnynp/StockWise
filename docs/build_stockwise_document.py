from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'StockWise_Project_Documentation.docx'

def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr(); shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), fill); tc_pr.append(shd)

def set_cell_border(cell, color='D9D9D9'):
    tc_pr = cell._tc.get_or_add_tcPr(); borders = tc_pr.first_child_found_in('w:tcBorders')
    if borders is None: borders = OxmlElement('w:tcBorders'); tc_pr.append(borders)
    for edge in ('top', 'left', 'bottom', 'right'):
        tag = 'w:' + edge; element = borders.find(qn(tag))
        if element is None: element = OxmlElement(tag); borders.append(element)
        element.set(qn('w:val'), 'single'); element.set(qn('w:sz'), '4'); element.set(qn('w:color'), color)

def style_cell(cell, header=False):
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_border(cell)
    if header: set_cell_shading(cell, '193F3D')
    for p in cell.paragraphs:
        p.paragraph_format.space_after = Pt(2); p.paragraph_format.space_before = Pt(2)
        for r in p.runs:
            r.font.name = 'Arial'; r.font.size = Pt(8.5); r.font.bold = header; r.font.color.rgb = RGBColor(255,255,255) if header else RGBColor(0,0,0)

def table(doc, headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers)); t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.style = 'Table Grid'
    for i, h in enumerate(headers):
        t.rows[0].cells[i].text = h; style_cell(t.rows[0].cells[i], True)
        if widths: t.rows[0].cells[i].width = Inches(widths[i])
    for row_index, row in enumerate(rows):
        cells = t.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = str(value); style_cell(cells[i])
            if row_index % 2 == 1: set_cell_shading(cells[i], 'F4F7F5')
            if widths: cells[i].width = Inches(widths[i])
    doc.add_paragraph()

def heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    for r in p.runs:
        r.font.name = 'Arial'; r.font.color.rgb = RGBColor(0,0,0)
    p.paragraph_format.space_before = Pt(14 if level == 1 else 8); p.paragraph_format.space_after = Pt(6)
    return p

def para(doc, text, bold_lead=None):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(7); p.paragraph_format.line_spacing = 1.12
    if bold_lead:
        r = p.add_run(bold_lead); r.bold = True; r.font.name = 'Arial'; r.font.size = Pt(10)
    r = p.add_run(text); r.font.name = 'Arial'; r.font.size = Pt(10)
    return p

def bullet(doc, text):
    p = doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after = Pt(3)
    r = p.add_run(text); r.font.name = 'Arial'; r.font.size = Pt(10)

doc = Document()
section = doc.sections[0]; section.top_margin = Inches(.75); section.bottom_margin = Inches(.7); section.left_margin = Inches(.78); section.right_margin = Inches(.78)
styles = doc.styles
styles['Normal'].font.name = 'Arial'; styles['Normal'].font.size = Pt(10)
styles['Title'].font.name = 'Arial'; styles['Title'].font.size = Pt(27); styles['Title'].font.color.rgb = RGBColor(0,0,0)

p = doc.add_paragraph(style='Title'); p.alignment = WD_ALIGN_PARAGRAPH.CENTER; p.add_run('StockWise Project Documentation')
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER; r = p.add_run('Inventory and Stock Analytics Web Application'); r.font.name = 'Arial'; r.font.size = Pt(14); r.font.bold = True
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER; r = p.add_run('Project overview, workflow, architecture, APIs, and database design'); r.font.name = 'Arial'; r.font.size = Pt(10)
doc.add_paragraph()
heading(doc, 'Project Purpose')
para(doc, 'StockWise is a web application for a small store team. It keeps the product catalogue, stock levels, reorder alerts, and purchase orders in one place. It gives staff a simple view of available products while allowing managers and administrators to keep inventory accurate.')
heading(doc, 'What the Application Does')
for item in ['Lets team members sign in according to their role.', 'Shows dashboard totals for inventory value, stock units, low-stock products, and open purchase orders.', 'Supports product search, category filtering, low-stock and out-of-stock filtering, and pagination.', 'Lets authorised users add, edit, and remove products.', 'Creates purchase-order drafts and tracks each order from draft through received.', 'Adds ordered quantities to stock when an order is received.', 'Shows category-level analytics with charts and tables.', 'Supports light and dark mode and uses Indian rupee formatting.']:
    bullet(doc, item)

doc.add_page_break()
heading(doc, 'System Overview')
para(doc, 'StockWise uses a standard MERN-style flow. The React application sends authenticated HTTP requests to the Express API. The API validates the request, checks the user role, reads or updates MongoDB through Mongoose, and returns JSON to the browser.')
table(doc, ['Layer', 'Technology', 'Responsibility'], [
    ['Frontend', 'React, Vite, Recharts, CSS', 'Provides login, dashboard, product, order, analytics, and settings screens.'],
    ['Backend', 'Node.js, Express', 'Provides REST API routes, validation, error handling, and role checks.'],
    ['Security', 'JWT and bcryptjs', 'Hashes passwords and identifies the signed-in user with bearer tokens.'],
    ['Database', 'MongoDB Atlas, Mongoose', 'Stores users, products, and purchase orders.'],
], [1.15, 1.65, 3.85])
heading(doc, 'Project Folder Structure')
para(doc, 'The project is separated so the frontend and backend can be installed and run independently.')
table(doc, ['Location', 'Contents'], [
    ['Frontend/', 'Vite configuration, React source files, API helper, stylesheet, and frontend package file.'],
    ['Backend/', 'Express server, MongoDB models, API routes, middleware, seed script, and backend package file.'],
    ['README.md', 'Simple GitHub setup instructions and feature overview.'],
    ['StockWise Project Documentation.docx', 'This project report.'],
], [1.55, 5.1])
heading(doc, 'How the Application Starts')
para(doc, 'First, the backend reads Backend/.env to obtain the MongoDB connection string and JWT secret. After the server connects to MongoDB, it listens on port 5000 by default. The frontend is started separately with Vite and normally runs on port 5173. The backend also permits local Vite ports 5170 to 5179, avoiding development CORS issues.')

doc.add_page_break()
heading(doc, 'User Roles and Access')
table(doc, ['Role', 'Main access'], [
    ['Admin', 'Full product, purchase-order, analytics, and team-user management.'],
    ['Manager', 'Product and purchase-order management, plus analytics.'],
    ['Staff', 'Inventory lookup, analytics viewing, and creation/viewing of their own purchase-order drafts.'],
], [1.25, 5.4])
heading(doc, 'Main Project Flow')
table(doc, ['Step', 'What happens'], [
    ['1. Sign in', 'The user enters a demo username/email and password. The frontend sends the data to POST /api/auth/login.'],
    ['2. Token check', 'The API verifies credentials and returns a JWT. The frontend saves it and sends it on protected requests.'],
    ['3. Dashboard', 'The frontend calls the summary endpoint to show inventory value, units, low-stock products, and open orders.'],
    ['4. Product work', 'The user searches or filters products. Admins and managers can open forms to create, edit, or delete products.'],
    ['5. Purchase order', 'The user adds products to a draft order. The server uses current product data to calculate stored line items and subtotal.'],
    ['6. Receive stock', 'An authorised user changes the order to received. The API increments stock once and retains the order status.'],
    ['7. Analytics', 'The frontend requests grouped category data and displays charts and tables using Indian rupees.'],
], [.9, 5.75])
heading(doc, 'Purchase Order Status Flow')
para(doc, 'A purchase order normally moves from Draft to Submitted, then Approved, and finally Received. It can also be Cancelled. Receiving is important because it is the status that increases inventory quantities. The API avoids crediting the same received order twice.')

doc.add_page_break()
heading(doc, 'Database Design')
para(doc, 'MongoDB stores three main collections. Mongoose schemas validate the shape of the data before it is saved. Object IDs connect purchase-order records to the users and products that they use.')
heading(doc, 'Users Collection')
table(doc, ['Field', 'Purpose'], [
    ['name', 'Team member display name.'], ['username', 'Simple local demo login name.'], ['email', 'Unique email address and alternate login identifier.'], ['password', 'bcrypt password hash; never returned to the frontend.'], ['role', 'admin, manager, or staff.'], ['createdAt / updatedAt', 'Automatic record timestamps.'],
], [1.7, 4.95])
heading(doc, 'Products Collection')
table(doc, ['Field', 'Purpose'], [
    ['name, brand, SKU, category', 'Core product identity and grouping. SKU is unique.'], ['description and image', 'Product details shown in the frontend.'], ['price', 'Current product price in INR; must not be negative.'], ['stock', 'Current available quantity; must not be negative.'], ['reorderPoint', 'Quantity at which a product is marked low stock.'], ['rating', 'Seeded catalogue display rating.'],
], [1.7, 4.95])
heading(doc, 'Purchase Orders Collection')
table(doc, ['Field', 'Purpose'], [
    ['number', 'Unique purchase-order identifier.'], ['supplier and notes', 'Supplier context and optional order notes.'], ['items', 'Snapshot of product ID, name, SKU, quantity, and unit price.'], ['subtotal', 'Server-calculated order amount.'], ['status', 'draft, submitted, approved, received, or cancelled.'], ['createdBy', 'Reference to the User who created the order.'],
], [1.7, 4.95])

doc.add_page_break()
heading(doc, 'API Summary')
para(doc, 'All protected routes expect an Authorization header in the form Bearer followed by the JWT. The API returns JSON. Validation and access errors use a readable message so the frontend can display a useful state to the user.')
table(doc, ['Method', 'Route', 'Use'], [
    ['POST', '/api/auth/login', 'Sign in with username/email and password.'],
    ['GET', '/api/auth/me', 'Read the signed-in user.'],
    ['POST', '/api/auth/users', 'Admin creates a team user.'],
    ['GET', '/api/products', 'Search, filter, and paginate products.'],
    ['POST / PATCH / DELETE', '/api/products', 'Authorised product management.'],
    ['GET / POST', '/api/orders', 'List or create purchase orders.'],
    ['PATCH', '/api/orders/:id/status', 'Update purchase-order status.'],
    ['GET', '/api/dashboard/summary', 'Dashboard totals and low-stock list.'],
    ['GET', '/api/dashboard/analytics', 'Category totals for analytics charts.'],
    ['GET', '/api/health', 'Simple API and database health check.'],
], [1.45, 2.2, 3.0])
heading(doc, 'Seed Data')
para(doc, 'The seed script creates demo team accounts, twelve product records with INR prices and product images, and four sample purchase orders. This allows the dashboard, filters, charts, roles, and order flows to be demonstrated immediately after running the seed command.')
heading(doc, 'Security and Validation')
for item in ['Passwords are hashed using bcryptjs before storage.', 'JWT tokens protect API routes and identify the current user.', 'Role middleware controls sensitive product, order, and user-management actions.', 'The server checks duplicate SKUs and responds with a 409 conflict.', 'Product price and stock values are validated to prevent negative inventory data.', 'Environment variables keep the MongoDB URI and JWT secret outside source control.']:
    bullet(doc, item)

doc.add_page_break()
heading(doc, 'Local Setup and Demonstration')
para(doc, 'Create Backend/.env from the example file, set MONGODB_URI and JWT_SECRET, then install packages separately in Backend and Frontend. Run npm run seed in Backend once to load the database. Start the backend with npm start, then start the frontend with npm run dev in a second terminal.')
heading(doc, 'Demo Accounts')
table(doc, ['Name', 'Role', 'Login', 'Password'], [
    ['Dnyaneshwar', 'Admin', 'dnyaneshwar or admin', 'admin'],
    ['Muskan', 'Manager', 'muskan or manager', 'manager'],
    ['Prajwal', 'Staff', 'prajwal or staff', 'staff'],
    ['Shushant', 'Staff', 'shushant', 'staff'],
], [1.4, 1.2, 2.4, 1.1])
heading(doc, 'Conclusion')
para(doc, 'StockWise demonstrates a complete frontend-to-backend inventory workflow. Its design keeps day-to-day tasks simple: staff can find stock and prepare orders, managers can maintain products and orders, and administrators can manage the team. MongoDB stores the operational data, Express applies validation and access rules, and the React interface turns that data into practical screens for inventory work.')

for section in doc.sections:
    footer = section.footer.paragraphs[0]; footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = footer.add_run('StockWise Project Documentation'); run.font.name = 'Arial'; run.font.size = Pt(8); run.font.color.rgb = RGBColor(90,90,90)

doc.save(OUT)
print(OUT)
