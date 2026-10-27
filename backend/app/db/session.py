import socket
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

def get_engine_with_ipv4():
    url = settings.DATABASE_URL
    # Ensure psycopg2 driver is used for high-performance stable pooling
    if url.startswith("postgresql://"):
        db_url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    else:
        db_url = url

    connect_args = {"connect_timeout": 15}
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if hostname and not hostname.replace(".", "").isdigit():
            # Known live pooler nodes in AWS Sydney for Supabase session pooler (port 5432)
            # 3.106.102.114 is excluded as it drops session TLS handshakes on 5432
            known_verified_ips = ["13.237.241.81", "13.238.183.126"]
            
            # Resolve DNS and prioritize verified responsive nodes
            dns_ips = []
            try:
                addrs = socket.getaddrinfo(hostname, parsed.port or 5432, socket.AF_INET)
                dns_ips = [a[4][0] for a in addrs]
            except Exception:
                pass
            
            # Select first verified IP present in DNS or fallback to first verified
            selected_ip = next((ip for ip in known_verified_ips if ip in dns_ips), known_verified_ips[0])
            connect_args["hostaddr"] = selected_ip
    except Exception:
        pass

    return create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
        connect_args=connect_args
    )

engine = get_engine_with_ipv4()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
