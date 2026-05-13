import { db } from "../config/db.js";

function resolveProductImage(mediaSrc) {
  let source = mediaSrc || "";

  if (!source) {
    return null;
  }

  // Handle JSON encoded strings (sometimes media tables store arrays)
  if (typeof source === "string" && (source.startsWith("[") || source.startsWith("{"))) {
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed) && parsed.length > 0) {
        source = parsed[0];
      } else if (typeof parsed === "object" && parsed.src) {
        source = parsed.src;
      }
    } catch (e) {
      // Not JSON, continue with original string
    }
  }

  if (typeof source !== "string") return null;

  if (source.startsWith("http://") || source.startsWith("https://")) {
    return source;
  }

  const cleaned = source.replace(/^\/+/, "");
  // If it's a relative path and doesn't contain a folder, assume it's in products/
  if (!cleaned.includes("/")) {
    return `https://vogstya.com/storage/products/${cleaned}`;
  }

  return `https://vogstya.com/storage/${cleaned}`;
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
      p.is_featured,
      p.is_auspicious,
      p.is_banner_main,
      p.is_banner_earrings,
      p.is_banner_necklaces,
      p.is_popular_jewellery,
      p.is_mens_shirts,
      p.is_womens_highlights,
      p.is_premium_sarees,
      p.is_ad,
      p.is_new,
      p.created_at,
      p.updated_at,
      p.media_id,
      p.image,
      p.image_url,
      p.sold_quantity,
      m.src AS media_src,
      c.id AS category_id,
      c.name AS category_name,
      sc.name AS sub_category_name,
      CASE WHEN fsp.product_id IS NOT NULL THEN 1 ELSE 0 END AS is_flash_sale,
      fsp.price AS flash_sale_price,
      fsp.discount AS flash_sale_discount,
      fsp.quantity AS flash_sale_total_qty,
      fsp.sale_quantity AS flash_sale_sold_qty
    FROM products p
    LEFT JOIN media m ON m.id = p.media_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
    LEFT JOIN flash_sale_products fsp ON fsp.product_id = p.id
    ORDER BY p.id DESC
  `;

  db.query(sql, (err, data) => {
    if (err) {
      console.error("GET Products Error:", err);
      return res.status(500).json(err);
    }

    const products = data.map((product) => {
      return {
        ...product,
        image: resolveProductImage(product.media_src || product.image_url || product.image)
      };
    });

    return res.json(products);
  });
};

export const addProduct = (req, res) => {
  const {
    name,
    image_url,
    image,
    price,
    buy_price = 0,
    discount_price = 0,
    metal,
    weight,
    size,
    category_id,
    description,
    short_description,
    quantity = 0,
    code,
    hsin_code,
    spcifications,
    meta_title,
    meta_description,
    meta_keywords,
    brand_id,
    unit_id,
    is_featured = 0,
    is_auspicious = 0,
    is_banner_main = 0,
    is_banner_earrings = 0,
    is_banner_necklaces = 0,
    is_popular_jewellery = 0,
    is_mens_shirts = 0,
    is_womens_highlights = 0,
    is_premium_sarees = 0,
    is_ad = 0,
    is_flash_sale = 0,
    sub_category_id,
    colors = [], 
    sizes = [],
  } = req.body;

  const slug = name.toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-") + "-" + Date.now().toString().slice(-4);

  const sql = `
    INSERT INTO products
    (name, slug, price, buy_price, discount_price, metal, weight, size, description, short_description, quantity, code, hsin_code, spcifications, meta_title, meta_description, meta_keywords, brand_id, unit_id, category_id, sub_category_id, image_url, is_active, is_featured, is_auspicious, is_banner_main, is_banner_earrings, is_banner_necklaces, is_popular_jewellery, is_mens_shirts, is_womens_highlights, is_premium_sarees, is_ad)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name, slug, price, buy_price, discount_price, metal, weight, size, description, short_description, quantity, code, hsin_code, spcifications, meta_title, meta_description, meta_keywords, brand_id, unit_id, category_id, sub_category_id, image_url, is_featured, is_auspicious, is_banner_main, is_banner_earrings, is_banner_necklaces, is_popular_jewellery, is_mens_shirts, is_womens_highlights, is_premium_sarees, is_ad
  ];

  db.query(
    sql,
    values,
    (err, result) => {
      if (err) {
        console.error("ADD Product Error:", err);
        return res.status(500).json(err);
      }
      
      const productId = result.insertId;

      if (category_id) {
        db.query("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [productId, category_id]);
      }

      if (is_flash_sale) {
        db.query(
          `INSERT INTO flash_sale_products (flash_sale_id, product_id, discount, quantity, price) 
           SELECT fs.id, ?, fs.discount, 50, (p.price - (p.price * fs.discount / 100))
           FROM flash_sales fs
           JOIN products p ON p.id = ?
           WHERE fs.status = 1 
           ORDER BY fs.id DESC LIMIT 1`,
          [productId, productId]
        );
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
    name, price, buy_price, discount_price, quantity, description, short_description, is_active,
    metal, weight, size, category_id, code, hsin_code, spcifications, meta_title, meta_description, meta_keywords,
    brand_id, unit_id, is_featured, is_auspicious, is_banner_main, is_banner_earrings, is_banner_necklaces,
    is_popular_jewellery, is_mens_shirts, is_womens_highlights, is_premium_sarees, is_ad, is_flash_sale,
    sub_category_id, image_url, colors = [], sizes = []
  } = req.body;

  const sql = `
    UPDATE products
    SET
      name = COALESCE(?, name),
      price = COALESCE(?, price),
      buy_price = COALESCE(?, buy_price),
      discount_price = COALESCE(?, discount_price),
      quantity = COALESCE(?, quantity),
      description = COALESCE(?, description),
      short_description = COALESCE(?, short_description),
      is_active = COALESCE(?, is_active),
      metal = COALESCE(?, metal),
      weight = COALESCE(?, weight),
      size = COALESCE(?, size),
      code = COALESCE(?, code),
      hsin_code = COALESCE(?, hsin_code),
      spcifications = COALESCE(?, spcifications),
      meta_title = COALESCE(?, meta_title),
      meta_description = COALESCE(?, meta_description),
      meta_keywords = COALESCE(?, meta_keywords),
      brand_id = COALESCE(?, brand_id),
      unit_id = COALESCE(?, unit_id),
      is_featured = COALESCE(?, is_featured),
      is_auspicious = COALESCE(?, is_auspicious),
      is_banner_main = COALESCE(?, is_banner_main),
      is_banner_earrings = COALESCE(?, is_banner_earrings),
      is_banner_necklaces = COALESCE(?, is_banner_necklaces),
      is_popular_jewellery = COALESCE(?, is_popular_jewellery),
      is_mens_shirts = COALESCE(?, is_mens_shirts),
      is_womens_highlights = COALESCE(?, is_womens_highlights),
      is_premium_sarees = COALESCE(?, is_premium_sarees),
      is_ad = COALESCE(?, is_ad),
      sub_category_id = COALESCE(?, sub_category_id),
      category_id = COALESCE(?, category_id),
      image_url = COALESCE(?, image_url),
      updated_at = NOW()
    WHERE id = ?
  `;

  const values = [
    name ?? null, price ?? null, buy_price ?? null, discount_price ?? null, quantity ?? null, 
    description ?? null, short_description ?? null, is_active ?? null, metal ?? null, weight ?? null, 
    size ?? null, code ?? null, hsin_code ?? null, spcifications ?? null, meta_title ?? null, 
    meta_description ?? null, meta_keywords ?? null, brand_id ?? null, unit_id ?? null, 
    is_featured ?? null, is_auspicious ?? null, is_banner_main ?? null, is_banner_earrings ?? null, 
    is_banner_necklaces ?? null, is_popular_jewellery ?? null, is_mens_shirts ?? null, 
    is_womens_highlights ?? null, is_premium_sarees ?? null, is_ad ?? null, 
    sub_category_id ?? null, category_id ?? null, image_url ?? null, id
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("UPDATE Product Error:", err);
      return res.status(500).json({ message: "Database error during product update", error: err.message });
    }

    // Sync child tables (non-blocking errors for UX stability)
    if (category_id !== undefined) {
      db.query("DELETE FROM product_categories WHERE product_id = ?", [id], () => {
        if (category_id) db.query("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [id, category_id]);
      });
    }

    if (is_flash_sale !== undefined) {
      db.query("DELETE FROM flash_sale_products WHERE product_id = ?", [id], () => {
        if (is_flash_sale) {
          db.query(
            `INSERT INTO flash_sale_products (flash_sale_id, product_id, discount, quantity, price) 
             SELECT fs.id, ?, fs.discount, 50, (p.price - (p.price * fs.discount / 100))
             FROM flash_sales fs JOIN products p ON p.id = ? WHERE fs.status = 1 ORDER BY fs.id DESC LIMIT 1`,
            [id, id]
          );
        }
      });
    }

    if (Array.isArray(colors)) {
      db.query("DELETE FROM product_colors WHERE product_id = ?", [id], () => {
        colors.forEach(colorId => db.query("INSERT INTO product_colors (product_id, color_id) VALUES (?, ?)", [id, colorId]));
      });
    }

    if (Array.isArray(sizes)) {
      db.query("DELETE FROM product_sizes WHERE product_id = ?", [id], () => {
        sizes.forEach(sizeId => db.query("INSERT INTO product_sizes (product_id, size_id) VALUES (?, ?)", [id, sizeId]));
      });
    }

    // Return the updated product
    const fetchSql = `
      SELECT p.*, m.src as media_src, c.name as category_name 
      FROM products p 
      LEFT JOIN media m ON m.id = p.media_id 
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? LIMIT 1
    `;
    db.query(fetchSql, [id], (fetchError, rows) => {
      if (fetchError || !rows.length) {
        return res.json({ message: "Product updated, but failed to fetch fresh data.", success: true });
      }
      res.json({
        message: "Product updated successfully.",
        success: true,
        data: rows[0]
      });
    });
  });
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

export const getActiveAd = (req, res) => {
  const sql = `
    (SELECT a.id, a.title, m.src AS media_src, 'custom' as type
     FROM ads a
     LEFT JOIN media m ON m.id = a.media_id
     WHERE a.status = 1)
    UNION
    (SELECT p.id, p.name as title, m.src AS media_src, 'product' as type
     FROM products p
     LEFT JOIN media m ON m.id = p.media_id
     WHERE p.is_ad = 1 AND p.is_active = 1)
    ORDER BY RAND()
    LIMIT 1
  `;

  db.query(sql, (err, data) => {
    if (err) {
      console.error("GET Active Ad Error:", err);
      return res.status(500).json(err);
    }

    if (!data.length) {
      return res.status(404).json({ message: "No active ads found." });
    }

    const ad = data[0];
    return res.json({
      ...ad,
      image: resolveProductImage(ad.media_src)
    });
  });
};
