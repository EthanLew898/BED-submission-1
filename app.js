
const express = require("express");
const sql = require("mssql");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// SQL Server configuration
const dbConfig = {
    user: "npbookstore1",
    password: "password",
    server: "localhost",
    database: "NPBookstore1",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Home route
app.get("/", (req, res) => {
    res.send("Welcome to NPBookstore API!");
});

// About route
app.get("/about", (req, res) => {
    res.json({
        name: "NPBookstore API",
        description: "Node.js API connected to SQL Server",
        version: "1.0.0"
    });
});

// Database connection test
app.get("/db-test", async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request().query(`
            SELECT
                DB_NAME() AS DatabaseName,
                SUSER_SNAME() AS LoginName
        `);

        res.json({
            message: "Database connected successfully!",
            data: result.recordset
        });

    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

// Get all categories
app.get("/categories", async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request().query(
            "SELECT id, name FROM Categories ORDER BY id"
        );

        res.json(result.recordset);

    } catch (error) {
        console.error("Error loading categories:", error.message);

        res.status(500).json({
            message: "Could not load categories"
        });
    }
});

// Get one category by ID
app.get("/categories/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(
                "SELECT id, name FROM Categories WHERE id = @id"
            );

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Could not retrieve category"
        });
    }
});

// Create a new category
app.post("/categories", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("name", sql.VarChar(100), name.trim())
            .query(`
                INSERT INTO Categories (name)
                OUTPUT INSERTED.id, INSERTED.name
                VALUES (@name)
            `);

        res.status(201).json({
            message: "Category created successfully",
            category: result.recordset[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Could not create category"
        });
    }
});

// Update a category
app.put("/categories/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("id", sql.Int, id)
            .input("name", sql.VarChar(100), name.trim())
            .query(`
                UPDATE Categories
                SET name = @name
                OUTPUT INSERTED.id, INSERTED.name
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.json({
            message: "Category updated successfully",
            category: result.recordset[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Could not update category"
        });
    }
});

// Delete a category
app.delete("/categories/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                DELETE FROM Categories
                OUTPUT DELETED.id, DELETED.name
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.json({
            message: "Category deleted successfully",
            category: result.recordset[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Could not delete category"
        });
    }
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(
        `NPBookstore API running at http://localhost:${PORT}`
    );
});
