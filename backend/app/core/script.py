import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

ELASTIC_URL = os.getenv("ELASTIC_URL")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")
INDEX_NAME = "shopping-data"
# The search endpoint
SEARCH_URL = f"{ELASTIC_URL}/{INDEX_NAME}/_search"

# Headers for authentication
headers = {
    "Authorization": f"ApiKey {ELASTIC_API_KEY}",
    "Content-Type": "application/json"
}

# Helper function to print results cleanly for the hackathon demo
def print_results(title, response_data):
    print(f"\n{'='*50}\n🔥 {title}\n{'='*50}")
    
    if "error" in response_data:
        print(f"Error: {json.dumps(response_data['error'], indent=2)}")
        return

    hits = response_data.get("hits", {}).get("hits", [])
    
    # Print total found
    total = response_data.get('hits', {}).get('total', {}).get('value', 0)
    print(f"Found {total} items:\n")

    for hit in hits:
        item = hit["_source"]
        print(f" - {item['product_name']}")
        print(f"   Store: {item['store_name']} | Price: ${item['price']:.2f} | Type: {item['store_type']}\n")

# ==========================================
# 2. QUERY 1: The Typo-Tolerant "Fuzzy" Search
# ==========================================
def test_fuzzy_search():
    query = {
        "query": {
            "match": {
                "product_name": {
                    "query": "spagheti", # Notice the deliberate typo!
                    "fuzziness": "AUTO"
                }
            }
        }
    }
    response = requests.post(SEARCH_URL, headers=headers, json=query)
    print_results("TEST 1: FUZZY SEARCH (Typo: 'spagheti')", response.json())

# ==========================================
# 3. QUERY 2: The "Survive Till Payday" Calculator
# ==========================================
def test_budget_search():
    query = {
        "query": {
            "bool": {
                "must": [
                    {
                        "terms": {
                            "category": ["Meat", "Pantry", "Dairy & Eggs"]
                        }
                    },
                    {
                        "range": {
                            "price": {
                                "lte": 3.00 # Strict $3.00 budget
                            }
                        }
                    }
                ]
            }
        },
        "sort": [
            { "price": "asc" } # Sort cheapest to most expensive
        ]
    }
    response = requests.post(SEARCH_URL, headers=headers, json=query)
    print_results("TEST 2: STRICT BUDGET (Under $3.00, Essentials Only)", response.json())

# ==========================================
# 4. QUERY 3: The Basket Optimizer (Aggregations)
# ==========================================
def test_basket_optimizer():
    query = {
        "size": 0, # We don't need the documents, just the math
        "query": {
            "match": {
                "product_name": "milk"
            }
        },
        "aggs": {
            "cheapest_by_store": {
                "terms": {
                    "field": "store_name" # Group by store
                },
                "aggs": {
                    "lowest_price": {
                        "min": {
                            "field": "price" # Find the lowest price in that group
                        }
                    }
                }
            }
        }
    }
    
    response = requests.post(SEARCH_URL, headers=headers, json=query)
    data = response.json()
    
    print(f"\n{'='*50}\n🔥 TEST 3: BASKET OPTIMIZER (Cheapest 'milk' by Store)\n{'='*50}")
    if "error" in data:
        print(f"Error: {json.dumps(data['error'], indent=2)}")
        return
        
    buckets = data.get("aggregations", {}).get("cheapest_by_store", {}).get("buckets", [])
    for bucket in buckets:
        store = bucket["key"]
        price = bucket["lowest_price"]["value"]
        print(f" - {store}: ${price:.2f}")
    print("\n")

# ==========================================
# 5. PRICE COMPARISON FOR API
# ==========================================
def run_elastic_comparison(items: list) -> list:
    """Search Elasticsearch for the cheapest option for each item in the list."""
    results = []
    for item in items:
        query = {
            "query": {
                "match": {
                    "product_name": {
                        "query": item,
                        "fuzziness": "AUTO"
                    }
                }
            },
            "sort": [{"price": "asc"}],
            "size": 5
        }
        response = requests.post(SEARCH_URL, headers=headers, json=query)
        data = response.json()
        hits = data.get("hits", {}).get("hits", [])
        if hits:
            cheapest = hits[0]["_source"]
            results.append({
                "item": item,
                "product_name": cheapest.get("product_name", item),
                "store_name": cheapest.get("store_name", ""),
                "price": cheapest.get("price", 0),
                "store_type": cheapest.get("store_type", ""),
                "category": cheapest.get("category", "")
            })
    return results

# ==========================================
# 6. RUN THE DEMO
# ==========================================
if __name__ == "__main__":
    test_fuzzy_search()
    test_budget_search()
    test_basket_optimizer()