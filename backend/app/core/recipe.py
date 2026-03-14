import os
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv

# 1. LOAD ENVIRONMENT VARIABLES
load_dotenv() # This reads the .env file automatically

ELASTIC_URL = os.getenv("ELASTIC_URL")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
INDEX_NAME = "shopping-data"

# Initialize OpenAI Client
client = OpenAI(api_key=OPENAI_API_KEY)

def generate_budget_recipe(budget, servings, target_calories):
    print(f"🍳 Firing up the AI Chef for a ${budget} budget...")

    # ==========================================
    # 2. RETRIEVAL (Elasticsearch)
    # ==========================================
    elastic_query = {
        "size": 40,
        "query": {
            "range": {
                "price": { "lte": float(budget) }
            }
        },
        "sort": [{ "price": "asc" }] # Ensures $0.00 pantry items are grabbed first
    }

    headers = {
        "Authorization": f"ApiKey {ELASTIC_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(f"{ELASTIC_URL}/{INDEX_NAME}/_search", headers=headers, json=elastic_query)
    
    if response.status_code != 200:
        print("Error fetching from Elasticsearch:", response.text)
        return

    elastic_data = response.json()
    
    # Clean up the data for the LLM
    available_ingredients = []
    for hit in elastic_data.get("hits", {}).get("hits", []):
        item = hit["_source"]
        available_ingredients.append({
            "id": item.get("product_id"),
            "name": item.get("product_name"),
            "price": item.get("price"),
            "store": item.get("store_name")
        })

    print(f"🛒 Found {len(available_ingredients)} affordable items locally. Sending to OpenAI...")

    # ==========================================
    # 3. GENERATION (OpenAI)
    # ==========================================
    prompt = f"""
    You are an expert nutritionist helping families in a cost-of-living crisis.
    Task: Create a recipe that feeds {servings} people.
    
    Constraints:
    1. BUDGET: The combined cost of all ingredients MUST NOT exceed ${budget}.
    2. CALORIES: The meal should aim for approximately {target_calories} calories per serving. Estimate based on ingredient names.
    3. INGREDIENTS: You may ONLY use ingredients from the "Available Items" JSON list provided below. Do not invent ingredients. Assume basic tap water is free.
    
    Available Items:
    {json.dumps(available_ingredients)}

    You must return a valid JSON object strictly matching this format:
    {{
      "recipeName": "Name of the dish",
      "totalCost": 0.00,
      "estimatedCaloriesPerServing": 0,
      "ingredientsToBuy": [
        {{ 
          "id": "must_be_exact_id_from_list", 
          "name": "Item Name", 
          "price": 0.00, 
          "store": "Store Name",
          "qty": 1 
        }}
      ],
      "instructions": ["Step 1", "Step 2"]
    }}
    """

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"} # Forces perfect JSON output
        )

        recipe_json = completion.choices[0].message.content
        recipe = json.loads(recipe_json)

        # ==========================================
        # 4. PRINT THE RESULTS FOR THE DEMO
        # ==========================================
        print(f"\n{'='*50}")
        print(f"🍽️  {recipe['recipeName'].upper()}")
        print(f"{'='*50}")
        print(f"Total Cost: ${recipe['totalCost']:.2f} (Under ${budget} limit)")
        print(f"Servings: {servings} | Est. Calories/Serving: {recipe['estimatedCaloriesPerServing']}\n")
        
        print("🛒 SHOPPING LIST:")
        for item in recipe["ingredientsToBuy"]:
            print(f" - [${item['price']:.2f}] {item['name']} (from {item['store']}) x{item['qty']}")
            
        print("\n👨‍🍳 INSTRUCTIONS:")
        for i, step in enumerate(recipe["instructions"], 1):
            print(f" {i}. {step}")
            
        print(f"{'='*50}\n")
        return recipe

    except Exception as e:
        print(f"OpenAI Error: {e}")
        return None

# ==========================================
# 5. RUN THE SCRIPT
# ==========================================
if __name__ == "__main__":
    # Test it out: $12 budget, 4 people, target 500 calories
    generate_budget_recipe(budget=12.00, servings=4, target_calories=500)