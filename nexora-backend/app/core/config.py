from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # =========================================
    # DATABASE
    # =========================================
    DATABASE_URL: str = "sqlite:///./nexora.db"

    # =========================================
    # AUTH
    # =========================================
    SECRET_KEY: str = ""

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # =========================================
    # AI API KEYS
    # =========================================
    GEMINI_API_KEY: str = ""

    GROQ_API_KEY: str = ""

    OPENROUTER_API_KEY: str = ""

    TAVILY_API_KEY: str = ""

    HUGGINGFACE_API_KEY: str = ""

    ELEVENLABS_API_KEY: str = ""

    # =========================================
    # AI PROVIDER CONFIGURATION
    # =========================================
    DEFAULT_AI_PROVIDER: str = "gemini"

    AI_FALLBACK_ORDER: str = "gemini,groq,openrouter"

    # ---- Provider Models ----
    GEMINI_MODEL: str = "gemini-2.5-flash"

    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    OPENROUTER_MODEL: str = "deepseek/deepseek-chat-v3-0324:free"

    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # ---- AI Generation Defaults ----
    DEFAULT_TEMPERATURE: float = 0.7

    DEFAULT_MAX_TOKENS: int = 4096

    REQUEST_TIMEOUT: int = 60

    # ---- Health Monitor ----
    PROVIDER_COOLDOWN_SECONDS: int = 60

    PROVIDER_FAILURE_THRESHOLD: int = 3

    MAX_RETRIES_PER_PROVIDER: int = 2

    # =========================================
    # CLERK AUTH
    # =========================================
    CLERK_SECRET_KEY: str = ""

    # =========================================
    # VECTOR DB
    # =========================================
    CHROMA_DB_DIR: str = "./chroma_db"

    # =========================================
    # HELPERS
    # =========================================
    @property
    def fallback_order_list(self) -> list:
        """Parse AI_FALLBACK_ORDER into a list."""
        return [
            p.strip().lower()
            for p in self.AI_FALLBACK_ORDER.split(",")
            if p.strip()
        ]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()