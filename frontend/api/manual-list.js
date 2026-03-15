import {
  buildProductFromHits,
  ensureUniqueProductIds,
  getElasticConfig,
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
        const query = {
          size: 25,
          query: {
            match: {
              product_name: {
                query: item,
                fuzziness: "AUTO",
              },
            },
          },
          sort: [{ price: "asc" }],
        };

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

        const bestMatchName = parsedHits[0].productName;
        const matchingHits = parsedHits.filter(
          (hit) => hit.productName === bestMatchName
        );

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
