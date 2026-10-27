import sys
from pathlib import Path
import uvicorn

root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if __name__ == "__main__":
    print("==================================================")
    print(" Starting FDR Guardian FastAPI Backend Server...")
    print(" API:    http://127.0.0.1:8000")
    print(" Docs:   http://127.0.0.1:8000/docs")
    print(" Health: http://127.0.0.1:8000/api/health")
    print("==================================================")
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
