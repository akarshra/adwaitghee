# Adwait Pure Desi Ghee E-commerce

A modern, responsive e-commerce web application for **Adwait Pure Desi Ghee**, built with a native HTML/CSS/JS frontend and a lightweight PHP/MySQL backend.

---

## Directory Structure

The repository is organized as follows:

```text
adwait-ghee/
├── frontend/             # Storefront pages and client-side assets
│   ├── css/              # Stylesheets (style.css, responsive.css, animations.css)
│   ├── js/               # JavaScript files (cart.js, checkout.js, payment.js, main.js)
│   ├── images/           # Image and graphic assets
│   ├── index.html        # Main landing page
│   └── *.html            # Product, Cart, Checkout, and other storefront pages
├── backend/              # PHP API endpoints (order creation, verification, configuration)
│   ├── config.php        # Application and Database configuration
│   ├── db.php            # PDO database connection initializer
│   ├── create-cod-order.php
│   ├── create-razorpay-order.php
│   └── verify-payment.php
├── database/             # Database schemas
│   └── schema.sql        # MySQL database creation & table structure
├── Dockerfile            # Configures PHP + Apache web server container
├── docker-compose.yml    # Coordinates local Web and Database containers
└── .gitignore            # Git ignore configurations
```

---

## Running the Project Locally (with Docker)

To run the project in a clean, isolated environment using Docker Compose:

1. **Start Docker Desktop** on your Mac.
2. Run the following command in the root directory:
   ```bash
   docker-compose up -d --build
   ```
3. Open your browser and navigate to:
   - **Storefront:** [http://localhost:9988](http://localhost:9988)

### Local Database Access
When the Docker container starts, it automatically initializes the database schema. You can connect to the database from your host Mac using any database client (e.g. TablePlus, DBeaver) using:
- **Host:** `localhost`
- **Port:** `33066`
- **Username:** `root`
- **Password:** `rootpassword`
- **Database:** `adwait_db`

---

## Technical Architecture

### Frontend
- Built using semantic **HTML5**, custom **Vanilla CSS** (supporting animations and responsive grids), and **Vanilla JS**.
- Integrates with the **Razorpay Standard Checkout** API for processing payments online.

### Backend
- Written in **PHP** using **PDO (PHP Data Objects)** to execute secure, prepared SQL queries.
- Dynamically reads configuration parameters (database credentials, API keys) from environment variables in Docker, falling back to local credentials when run outside Docker.
