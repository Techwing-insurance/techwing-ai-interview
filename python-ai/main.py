"""
TechWings AI Service — FastAPI Application
Port: 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import resume_router, technical_router, hr_router, report_router, tts_router

app = FastAPI(
    title="TechWings AI Service",
    description="AI microservice for Resume Analysis, Interview Evaluation, and Report Generation",
    version="1.0.0"
)

# CORS — allow Spring Boot (8080) and React (4200/3000) to call
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(resume_router.router)
app.include_router(technical_router.router)
app.include_router(hr_router.router)

app.include_router(report_router.router)
app.include_router(tts_router.router)

@app.get("/health")
def health():
    return {"status": "UP", "service": "TechWings AI Service", "version": "1.0.0"}

@app.get("/")
def root():
    return {"message": "TechWings AI Service is running. Visit /docs for API documentation."}

# Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
