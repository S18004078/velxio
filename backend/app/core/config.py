from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    DATABASE_URL: str = "sqlite+aiosqlite:///./openwokwi.db"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
