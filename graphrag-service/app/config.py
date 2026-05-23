from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-2.5-flash"
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_database: str = ""
    mysql_user: str = ""
    mysql_password: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("neo4j_uri", mode="before")
    @classmethod
    def normalize_local_neo4j_uri(cls, value: str) -> str:
        if not isinstance(value, str):
            return value

        if value.startswith("neo4j://127.0.0.1") or value.startswith("neo4j://localhost"):
            return value.replace("neo4j://", "bolt://", 1)

        return value


settings = Settings()
