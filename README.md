# UnavuHub — Online Food Ordering & Restaurant Management System

## 🚀 Quick Start

1. **Open `index.html`** in any modern browser — no server required!
2. All data is stored in **LocalStorage** (no backend needed).

---

## 🔑 Login Credentials

### Admin
| Field    | Value                  |
|----------|------------------------|
| Email    | admin@unavuhub.com     |
| Password | admin123               |

### Sample Customer (pre-seeded)
| Field    | Value                  |
|----------|------------------------|
| Email    | Bala@example.com      |
| Password | Balaa123               |

---

## 📁 Project Structure

```
unavuhub/
├── index.html              ← Customer menu + homepage
├── login.html              ← Login (customer + admin)
├── register.html           ← Customer registration
├── cart.html               ← Shopping cart + checkout
├── orders.html             ← Customer order history + tracking
├── admin-dashboard.html    ← Admin overview + stats
├── admin-menu.html         ← Menu CRUD management
├── admin-orders.html       ← All orders + status management
├── admin-customers.html    ← Customer management
├── css/
│   └── style.css           ← Complete design system
└── js/
    ├── db.js               ← LocalStorage data layer
    └── admin.js            ← Admin layout + shared utilities
```

---

## ✨ Features

### Customer
- Register / Login / Logout
- Browse menu with search, category & veg/non-veg filters
- Add to cart, update quantity, remove items
- Checkout with payment method selection
- View order history with live status tracker
- Cancel pending orders

### Admin
- Dashboard with total orders, revenue, customers, pending count
- Menu management: add, edit, delete, mark popular, image URL
- Order management: view all, update status, view details, delete
- Customer management: view profiles, order history, total spent
- Real-time stats (update as data changes)

---

## 🏗️ Tech Stack

| Layer     | Technology               |
|-----------|--------------------------|
| Frontend  | HTML5, CSS3, JavaScript  |
| Framework | Bootstrap 5.3            |
| Icons     | Font Awesome 6.5         |
| Storage   | LocalStorage (CRUD)      |
| Fonts     | Syne + DM Sans (Google)  |

---

## 📱 Pages Overview

| URL                    | Description                     |
|------------------------|---------------------------------|
| `index.html`           | Food menu with filters + search |
| `login.html`           | Unified login page              |
| `register.html`        | New customer registration       |
| `cart.html`            | Cart management + checkout      |
| `orders.html`          | My orders + status tracking     |
| `admin-dashboard.html` | Admin stats + recent orders     |
| `admin-menu.html`      | Add / edit / delete menu items  |
| `admin-orders.html`    | All orders + status updates     |
| `admin-customers.html` | Registered customers list       |

---

## 🎨 Design System

- **Primary:** Saffron Orange `#F97316`
- **Accent:** Indian Green `#16A34A`
- **Display Font:** Syne (headings)
- **Body Font:** DM Sans
- **Theme:** Warm charcoal dark sidebar + cream white content area

---

*UnavuHub — "Unavu" means "Food" in Tamil 🍛*
