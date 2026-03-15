import {
  buildProductFromHits,
  ensureUniqueProductIds,
  getElasticConfig,
  groupHitsByProductName,
  parseElasticHits,
  parseJsonBody,
} from "./_lib/elastic.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const items = requireItemsArray(body?.items);

    const { searchUrl, headers } = getElasticConfig();

    const results = await Promise.all(
      items.map(async (item) => {
        const query = buildManualSearchQuery(item);

        const response = await fetch(searchUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(query),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Elasticsearch query failed: ${errorText}`);
        }

        const data = await response.json();
        const parsedHits = parseElasticHits(data);
        if (parsedHits.length === 0) {
          throw new Error(`No matches found for "${item}".`);
        }

        const grouped = groupHitsByProductName(parsedHits);
        const bestMatchName = selectBestProductName(item, grouped);
        const matchingHits = grouped.get(bestMatchName);
        if (!matchingHits || matchingHits.length === 0) {
          throw new Error(`No matches found for "${item}".`);
        }

        return buildProductFromHits(bestMatchName, matchingHits);
      })
    );

    res.status(200).json({
      items: ensureUniqueProductIds(results),
    });
  } catch (error) {
    res.status(500).json({
      error: "Server error while searching for items.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function requireItemsArray(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Invalid items: expected a non-empty array of strings.");
  }

  return items.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Invalid item at index ${index}.`);
    }
    return item.trim();
  });
}

function buildManualSearchQuery(query) {
  const size = 50;
  const matchProductName = {
    query,
    operator: "and",
    boost: 2,
  };

  if (query.length >= 5) {
    matchProductName.fuzziness = "AUTO";
  }

  return {
    size,
    query: {
      bool: {
        should: [
          { match_phrase: { product_name: { query, boost: 5 } } },
          { match: { product_name: matchProductName } },
          { match: { category: { query, operator: "and", boost: 1 } } },
        ],
        minimum_should_match: 1,
      },
    },
    sort: [{ _score: "desc" }, { price: "asc" }],
  };
}

function selectBestProductName(query, grouped) {
  let bestName;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestPrice = Number.POSITIVE_INFINITY;
  const normalisedQuery = normaliseString(query);

  for (const [name, hits] of grouped) {
    if (!Array.isArray(hits) || hits.length === 0) {
      throw new Error(`No hits found for "${name}".`);
    }
    const score = scoreProductCandidate(
      normalisedQuery,
      normaliseString(name),
      normaliseString(hits[0].category)
    );
    const minPrice = minFinalPrice(hits);
    if (score > bestScore || (score === bestScore && minPrice < bestPrice)) {
      bestName = name;
      bestScore = score;
      bestPrice = minPrice;
    }
  }

  if (!bestName) {
    throw new Error(`No matches found for "${query}".`);
  }

  return bestName;
}

function scoreProductCandidate(normalisedQuery, normalisedName, normalisedCategory) {
  const tokens = normalisedQuery.split(/\s+/).filter(Boolean);
  let score = 0;

  if (normalisedName === normalisedQuery) score += 120;
  if (normalisedName.startsWith(normalisedQuery)) score += 80;
  if (normalisedName.includes(normalisedQuery)) score += 50;

  const nameTokenMatches = tokens.filter((token) => normalisedName.includes(token)).length;
  score += nameTokenMatches * 15;

  if (normalisedCategory.includes(normalisedQuery)) score += 25;
  const categoryTokenMatches = tokens.filter((token) =>
    normalisedCategory.includes(token)
  ).length;
  score += categoryTokenMatches * 10;

  score -= Math.min(30, Math.floor(normalisedName.length / 5));
  return score;
}

function normaliseString(value) {
  if (typeof value !== "string") {
    throw new Error("Expected a string.");
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function minFinalPrice(hits) {
  return hits.reduce((min, hit) => {
    const finalPrice = hit.salePrice ?? hit.price;
    return finalPrice < min ? finalPrice : min;
  }, Number.POSITIVE_INFINITY);
}
