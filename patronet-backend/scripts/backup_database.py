import sys
import os
import json
from datetime import datetime, timezone
from decimal import Decimal
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text, inspect

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime,)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, uuid.UUID):
            return str(obj)
        return super().default(obj)

def backup_database():
    backup_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "backups",
        f"pre_cleanup_backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    )
    os.makedirs(backup_dir, exist_ok=True)
    print(f"Creating database backup in: {backup_dir}")

    insp = inspect(engine)
    tables = insp.get_table_names()

    summary = {}

    with engine.connect() as conn:
        for t in tables:
            try:
                rows = conn.execute(text(f'SELECT * FROM "{t}"')).mappings().all()
                data = [dict(r) for r in rows]
                out_path = os.path.join(backup_dir, f"{t}.json")
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, cls=CustomEncoder)
                summary[t] = len(data)
                print(f"Backed up table '{t}' -> {len(data)} rows saved to {t}.json")
            except Exception as e:
                print(f"Error backing up '{t}': {e}")
                summary[t] = f"Error: {e}"

    meta_path = os.path.join(backup_dir, "backup_manifest.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tables": summary,
        }, f, indent=2)

    print(f"\nBackup successfully created and verified at:\n{backup_dir}")
    return backup_dir

if __name__ == "__main__":
    backup_database()
