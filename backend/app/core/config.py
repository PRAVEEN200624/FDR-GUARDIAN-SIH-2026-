from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "FDR Guardian Backend"
    API_V1_STR: str = "/api"
    
    # Supabase PostgreSQL
    DATABASE_URL: str = Field(
        default="postgresql://postgres.smyglbuwsbjzrvjglwjo:RmkecC12345612@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
    )
    SUPABASE_URL: str = Field(default="https://smyglbuwsbjzrvjglwjo.supabase.co")
    SUPABASE_ANON_KEY: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")

    # JWT
    SECRET_KEY: str = Field(default="fdr_guardian_secure_secret_key_change_in_production_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    # CORS
    FRONTEND_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
