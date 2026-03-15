import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env.local from the project root (same directory as the api/ folder)
const __libDirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__libDirname, "../../.env.local") });

const INDEX_NAME = "shopping-data";

const REQUIRED_STRING_FIELDS = {
  productName: ["product_name", "productName", "name"],
  category: ["category"],
  unit: ["unit", "unit_name", "unit_size", "package_size", "size"],
  storeName: ["store_name", "storeName"],
};

const OPTIONAL_ID_FIELDS = {
  productId: ["product_id", "productId", "id"],
  storeId: ["store_id", "storeId"],
};

const OPTIONAL_BOOLEAN_FIELDS = {
  onSale: ["on_sale", "onSale"],
  weeklySpecial: ["weekly_special", "weeklySpecial"],
};

const OPTIONAL_NUMBER_FIELDS = {
  salePrice: ["sale_price", "salePrice"],
};

export function getElasticConfig() {
  const baseUrl = normaliseBaseUrl(readEnv("ELASTIC_URL"));
  const apiKey = readEnv("ELASTIC_API_KEY");

  return {
    searchUrl: `${baseUrl}/${INDEX_NAME}/_search`,
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      "Content-Type": "application/json",
    },
  };
}

export async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.trim() !== "") {
    return JSON.parse(req.body);
  }

  const rawBody = await readRawBody(req);
  if (rawBody.trim() === "") {
    throw new Error("Request body is required.");
  }

  return JSON.parse(rawBody);
}

export function parseElasticHits(data) {
  const hits = data?.hits?.hits;
  if (!Array.isArray(hits)) {
    throw new Error("Unexpected Elasticsearch response: hits.hits is missing.");
  }
  return hits.map(parseHit);
}

export function buildProductFromHits(productName, hits) {
  if (!Array.isArray(hits) || hits.length === 0) {
    throw new Error(`No Elasticsearch hits available for "${productName}".`);
  }

  const [first] = hits;
  const id = first.productId ?? slugify(productName);
  const category = first.category;
  const unit = first.unit;

  for (const hit of hits) {
    if (hit.productName !== productName) {
      throw new Error(`Mismatched product name "${hit.productName}".`);
    }
    if (hit.category !== category) {
      throw new Error(`Category mismatch for "${productName}".`);
    }
    if (hit.unit !== unit) {
      throw new Error(`Unit mismatch for "${productName}".`);
    }
  }

  const pricesByStore = new Map();
  for (const hit of hits) {
    const finalPrice = hit.salePrice ?? hit.price;
    const existing = pricesByStore.get(hit.storeId);
    if (!existing || finalPrice < existing.finalPrice) {
      pricesByStore.set(hit.storeId, {
        storeId: hit.storeId,
        storeName: hit.storeName,
        price: hit.price,
        onSale: hit.onSale,
        salePrice: hit.salePrice,
        weeklySpecial: hit.weeklySpecial,
        finalPrice,
      });
    }
  }

  const prices = Array.from(pricesByStore.values())
    .sort((a, b) => a.finalPrice - b.finalPrice)
    .map(({ finalPrice, ...price }) => removeUndefined(price));

  if (prices.length === 0) {
    throw new Error(`No store prices resolved for "${productName}".`);
  }

  return {
    id,
    name: productName,
    category,
    unit,
    prices,
  };
}

export function groupHitsByProductName(parsedHits) {
  const grouped = new Map();
  for (const hit of parsedHits) {
    const list = grouped.get(hit.productName) ?? [];
    list.push(hit);
    grouped.set(hit.productName, list);
  }
  return grouped;
}

export function ensureUniqueProductIds(products) {
  const counts = new Map();
  for (const product of products) {
    const baseId = product.id;
    const count = counts.get(baseId) ?? 0;
    const nextCount = count + 1;
    counts.set(baseId, nextCount);
    if (count > 0) {
      product.id = `${baseId}-${nextCount}`;
    }
  }
  return products;
}

function parseHit(hit) {
  if (!hit || typeof hit !== "object") {
    throw new Error("Elasticsearch hit is not an object.");
  }

  const source = hit._source;
  if (!source || typeof source !== "object") {
    throw new Error("Elasticsearch hit is missing _source.");
  }

  const productName = getRequiredString(source, REQUIRED_STRING_FIELDS.productName, "product_name");
  const category = getRequiredString(source, REQUIRED_STRING_FIELDS.category, "category");
  const unit = getRequiredString(source, REQUIRED_STRING_FIELDS.unit, "unit");
  const storeName = getRequiredString(source, REQUIRED_STRING_FIELDS.storeName, "store_name");
  const price = getRequiredNumber(source, ["price"], "price");
  const productId = getOptionalId(source, OPTIONAL_ID_FIELDS.productId, "product_id");
  const storeId = getOptionalId(source, OPTIONAL_ID_FIELDS.storeId, "store_id") ?? slugify(storeName);
  const onSale = getOptionalBoolean(source, OPTIONAL_BOOLEAN_FIELDS.onSale, "on_sale") ?? false;
  const weeklySpecial = getOptionalBoolean(source, OPTIONAL_BOOLEAN_FIELDS.weeklySpecial, "weekly_special");
  const salePrice = getOptionalNumber(source, OPTIONAL_NUMBER_FIELDS.salePrice, "sale_price");

  if (onSale && salePrice === undefined) {
    throw new Error(`sale_price is required when on_sale is true for "${productName}".`);
  }

  const resolvedOnSale = salePrice !== undefined ? true : onSale;
  const resolvedSalePrice = salePrice;

  return {
    productName,
    category,
    unit,
    storeName,
    storeId,
    productId,
    price,
    onSale: resolvedOnSale,
    salePrice: resolvedSalePrice,
    weeklySpecial,
  };
}

function readEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}.`);
  }
  return value;
}

function normaliseBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function getRequiredString(source, fields, label) {
  for (const field of fields) {
    const value = source[field];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  throw new Error(`Missing required field: ${label}.`);
}

function getOptionalId(source, fields, label) {
  for (const field of fields) {
    const value = source[field];
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    throw new Error(`Invalid ${label}: expected string or number.`);
  }
  return undefined;
}

function getOptionalBoolean(source, fields, label) {
  for (const field of fields) {
    const value = source[field];
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === "boolean") {
      return value;
    }
    throw new Error(`Invalid ${label}: expected boolean.`);
  }
  return undefined;
}

function getOptionalNumber(source, fields, label) {
  for (const field of fields) {
    const value = source[field];
    if (value === undefined || value === null) {
      continue;
    }
    return normaliseNumber(value, label);
  }
  return undefined;
}

function getRequiredNumber(source, fields, label) {
  for (const field of fields) {
    const value = source[field];
    if (value === undefined || value === null) {
      continue;
    }
    return normaliseNumber(value, label);
  }
  throw new Error(`Missing required field: ${label}.`);
}

function normaliseNumber(value, label) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error(`Invalid ${label}: expected a number.`);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function removeUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );
}
