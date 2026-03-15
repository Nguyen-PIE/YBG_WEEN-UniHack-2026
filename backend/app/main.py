import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Import your core logic modules
from app.core.recipe import generate_budget_recipe
from app.core.script import run_elastic_comparison # Assuming you name it this

app = FastAPI(
    title="Budget Bunny API",
    description="Backend for the cheapest grocery search & meal planner",
    version="1.0.0"
)

# 1. SETUP CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. DEFINE DATA MODELS
class RecipeRequest(BaseModel):
    budget: float
    servings: int
    target_calories: int

class SearchRequest(BaseModel):
    items: List[str]

# 3. ENDPOINTS
@app.get("/health")
def health_check():
    return {"status": "online", "mascot": "🐇"}

@app.post("/generate-recipe")
async def create_recipe(request: RecipeRequest):
    try:
        # Pass the validated request data to your core logic
        recipe = generate_budget_recipe(
            budget=request.budget, 
            servings=request.servings, 
            target_calories=request.target_calories
        )
        
        if not recipe:
            raise HTTPException(status_code=404, detail="No recipes found within that budget")
            
        return recipe
    except Exception as e:
        # Log the error here if you had a logger
        raise HTTPException(status_code=500, detail=f"Chef AI Error: {str(e)}")

@app.post("/search-prices")
async def search_prices(request: SearchRequest):
    try:
        # items is now guaranteed to be a list of strings thanks to SearchRequest
        result = run_elastic_comparison(request.items)
        
        if not result:
            return {"optimized_items": [], "message": "No matches found in your area"}
            
        return {"optimized_items": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search Error: {str(e)}")

# 4. RUN
if __name__ == "__main__":
    # Using 'app:app' and reload=True is better for development
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)