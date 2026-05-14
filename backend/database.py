from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus
import ssl

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", ""))
DB_NAME = os.getenv("DB_NAME")

# Create database URL without SSL for now (fixes the SSL error)
# For production with SSL, we'll use a different approach
DATABASE_URL_WITH_DB = f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?ssl=false"

engine = None
AsyncSessionLocal = None
Base = declarative_base()


async def get_engine():
    global engine, AsyncSessionLocal

    if engine is None:
        engine = create_async_engine(
            DATABASE_URL_WITH_DB,
            echo=False,  # Set to False for production
            pool_size=5,  # Smaller pool for free tier
            max_overflow=10,
            pool_pre_ping=True,  # Verify connections before using
            pool_recycle=3600,  # Recycle connections every hour
            pool_timeout=30,  # Timeout for getting connection from pool
            connect_args={
                "connect_timeout": 30,  # Connection timeout
                "autocommit": False,
            }
        )

        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )

    return engine


async def get_db():
    """Dependency for getting database session"""
    await get_engine()
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    await get_engine()
    
    async with engine.begin() as conn:
        # Create users table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                photo VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        # Create conversations table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                title VARCHAR(255) DEFAULT 'New Conversation',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            )
        """))

        # Create messages table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conversation_id INT NOT NULL,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                INDEX idx_conversation_id (conversation_id),
                INDEX idx_created_at (created_at)
            )
        """))

        # Create user_sessions table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                token VARCHAR(500) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_token (token)
            )
        """))

        # Create feedback table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INT PRIMARY KEY AUTO_INCREMENT,
                message_id INT NOT NULL,
                feedback_type VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
                INDEX idx_message_id (message_id)
            )
        """))

        # Optional: Add fulltext indexes (ignore errors if they already exist)
        try:
            await conn.execute(text(
                "ALTER TABLE conversations ADD FULLTEXT INDEX ft_title (title)"
            ))
        except Exception:
            pass

        try:
            await conn.execute(text(
                "ALTER TABLE messages ADD FULLTEXT INDEX ft_content (content)"
            ))
        except Exception:
            pass


async def close_db():
    """Close database connections (for graceful shutdown)"""
    global engine
    if engine:
        await engine.dispose()
        print("Database engine disposed")