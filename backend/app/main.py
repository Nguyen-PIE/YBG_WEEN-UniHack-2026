from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from recipe import generate_budget_recipe 

app = FastAPI(title="UniHack 2026 API")

# 1. SETUP CORS (Essential so your React app can talk to this)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. DEFINE DATA MODELS (What the frontend sends)
class RecipeRequest(BaseModel):
    budget: float
    servings: int
    target_calories: int

# 3. ENDPOINTS
@app.get("/")
def health_check():
    return {"status": "online", "message": "Chef AI is cooking"}

@app.post("/generate-recipe")
async def create_recipe(request: RecipeRequest):
    try:
        recipe = generate_budget_recipe(
            budget=request.budget, 
            servings=request.servings, 
            target_calories=request.target_calories
        )
        
        if not recipe:
            raise HTTPException(status_code=500, detail="Failed to generate recipe")
            
        return recipe
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. RUN (For local testing)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)