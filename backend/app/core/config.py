"""
Application Configuration Settings
Loads environment variables from .env
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Electricity Theft Intelligence & Inspection Platform"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "mysql+pymysql://theft_admin:password@localhost:3306/electricity_theft_db?charset=utf8mb4"
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "electricity_theft_db"
    DB_USER: str = "theft_admin"
    DB_PASSWORD: str = ""
    
    # JWT & Security
    JWT_SECRET_KEY: str = "default_secret_key_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # CORS Origins (comma-separated or wildcard in dev)
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:8000"
    
    # Machine Learning
    MODEL_DIR: str = "models/v1"
    ACTIVE_MODEL_VERSION: str = "v1.0.0"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="allow"
    )

    @property
    def cors_origins(self) -> List[str]:
        if self.BACKEND_CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
