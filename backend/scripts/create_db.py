"""Quick dev bootstrap: creates every table directly from the SQLAlchemy
models (Base.metadata.create_all), no Alembic history involved.

Use this for a throwaway local/dev database. For anything you intend to
evolve over time (staging, production, Neon), use Alembic migrations
instead: `alembic upgrade head`.

Usage:
    python scripts/create_db.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import Base, engine  # noqa: E402
from app import models  # noqa: E402,F401  (populates Base.metadata)


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All tables created.")


if __name__ == "__main__":
    asyncio.run(main())
