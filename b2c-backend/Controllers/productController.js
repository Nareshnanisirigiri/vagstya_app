import { db } from "../config/db.js";

function resolveProductImage(mediaSrc) {
  const source = mediaSrc || "";

  if (!source) {
    return null;
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    return source;
  }

  return `https://vogstya.com/storage/${source.replace(/^\/+/, "")}`;
}

export const getProducts = (req, res) => {
  const sql = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.price,
      p.discount_price,
      p.short_description,
      p.description,
      p.quantity,
      p.is_active,
      p.is_new,
      p.created_at,
      p.updated_at,
      p.media_id,
      m.src AS media_src,
      c.id AS category_id,
      c.name AS category_name
    FROM products p
    LEFT JOIN media m ON m.id = p.media_id
    LEFT JOIN product_categories pc ON pc.product_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    ORDER BY p.id DESC
  `;

  db.query(sql, (err, data) => {
    if (err) {
      return res.status(500).json(err);
    }

    const products = data.map((product) => {
      return {
        ...product,
        image: resolveProductImage(product.media_src)
      };
    });

    return res.json(products);
  });
};

export const addProduct = (req, res) => {
  const {
    name,
    image,
    price,
    discount_price = 0,
    metal,
    weight,
    size,
    category_id,
    description,
    quantity = 0,
    colors = [], 
    sizes = [],
  } = req.body;

  const slug = name.toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-") + "-" + Date.now().toString().slice(-4);

  const sql = `
    INSERT INTO products
    (name, slug, price, discount_price, metal, weight, size, description, quantity, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  db.query(
    sql,
    [name, slug, price, discount_price, metal, weight, size, description, quantity],
    (err, result) => {
      if (err) return res.status(500).json(err);
      
      const productId = result.insertId;

      if (category_id) {
        db.query("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [productId, category_id]);
      }

      if (Array.isArray(colors)) {
        colors.forEach(colorId => {
          db.query("INSERT INTO product_colors (product_id, color_id) VALUES (?, ?)", [productId, colorId]);
        });
      }

      if (Array.isArray(sizes)) {
        sizes.forEach(sizeId => {
          db.query("INSERT INTO product_sizes (product_id, size_id) VALUES (?, ?)", [productId, sizeId]);
        });
      }

      return res.json({ message: "Product added successfully", id: productId });
    }
  );
};

export const updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    discount_price,
    quantity,
    description,
    is_active,
    metal,
    weight,
    size,
    category_id,
    colors = [],
    sizes = [],
  } = req.body;

  const sql = `
    UPDATE products
    SET
      name = COALESCE(?, name),
      price = COALESCE(?, price),
      discount_price = COALESCE(?, discount_price),
      quantity = COALESCE(?, quantity),
      description = COALESCE(?, description),
      is_active = COALESCE(?, is_active),
      metal = COALESCE(?, metal),
      weight = COALESCE(?, weight),
      size = COALESCE(?, size),
      updated_at = NOW()
    WHERE id = ?
  `;

  db.query(
    sql,
    [name ?? null, price ?? null, discount_price ?? null, quantity ?? null, description ?? null, is_active ?? null, metal ?? null, weight ?? null, size ?? null, id],
    (err) => {
      if (err) return res.status(500).json(err);

      // Sync Category
      if (category_id !== undefined) {
        db.query("DELETE FROM product_categories WHERE product_id = ?", [id]);
        if (category_id) {
          db.query("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [id, category_id]);
        }
      }

      // Sync Colors
      if (Array.isArray(colors)) {
        db.query("DELETE FROM product_colors WHERE product_id = ?", [id], () => {
          colors.forEach(colorId => {
            db.query("INSERT INTO product_colors (product_id, color_id) VALUES (?, ?)", [id, colorId]);
          });
        });
      }

      // Sync Sizes
      if (Array.isArray(sizes)) {
        db.query("DELETE FROM product_sizes WHERE product_id = ?", [id], () => {
          sizes.forEach(sizeId => {
            db.query("INSERT INTO product_sizes (product_id, size_id) VALUES (?, ?)", [id, sizeId]);
          });
        });
      }

      // Return updated record
      db.query(
        "SELECT p.*, m.src as media_src FROM products p LEFT JOIN media m ON m.id = p.media_id WHERE p.id = ? LIMIT 1",
        [id],
        (fetchError, rows) => {
          if (fetchError) return res.status(500).json(fetchError);
          if (!rows.length) return res.status(404).json({ message: "Product not found." });

          return res.json({
            message: "Product updated successfully.",
            data: {
              ...rows[0],
              image: resolveProductImage(rows[0].media_src),
            },
          });
        }
      );
    }
  );
};

export const deleteProduct = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.json({ message: "Product removed successfully." });
  });
};
