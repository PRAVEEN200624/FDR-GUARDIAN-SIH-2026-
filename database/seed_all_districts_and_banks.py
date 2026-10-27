import urllib.request
import json
import psycopg2
from psycopg2.extras import execute_values

print("Connecting to Supabase PostgreSQL...", flush=True)
conn = psycopg2.connect(
    'postgresql://postgres.smyglbuwsbjzrvjglwjo:RmkecC12345612@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require',
    hostaddr='13.238.183.126'
)
conn.autocommit = True
cur = conn.cursor()

# ==========================================
# 1. SEED ALL DISTRICTS IN INDIA (722 Districts)
# ==========================================
cur.execute("SELECT id, name, code FROM states;")
states = cur.fetchall()
db_states = {s[1].strip().lower(): s[0] for s in states}

print("Fetching all Indian States & Districts dataset...", flush=True)
url_districts = 'https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json'
req = urllib.request.urlopen(url_districts)
data_districts = json.loads(req.read().decode('utf-8'))

districts_batch = []
for item in data_districts['states']:
    raw_state_name = item['state'].strip()
    norm_name = raw_state_name.lower()
    
    state_id = db_states.get(norm_name)
    if not state_id:
        for s_norm, s_id in db_states.items():
            if norm_name in s_norm or s_norm in norm_name:
                state_id = s_id
                break
    
    if not state_id:
        continue
    
    for dist in item['districts']:
        dist_name = dist.strip()
        code_prefix = dist_name[:3].upper()
        districts_batch.append((state_id, dist_name, code_prefix))

print(f"Batch inserting {len(districts_batch)} districts into Supabase...", flush=True)
execute_values(
    cur,
    """
    INSERT INTO districts (state_id, name, code)
    VALUES %s
    ON CONFLICT (state_id, name) DO NOTHING;
    """,
    districts_batch,
    page_size=500
)
cur.execute("SELECT count(*) FROM districts;")
total_districts = cur.fetchone()[0]
print(f"Total districts in Supabase: {total_districts}", flush=True)

# ==========================================
# 2. SEED ALL BANKS IN INDIA (From RBI/Razorpay Registry)
# ==========================================
print("Fetching official Indian Banks registry (IFSC dataset)...", flush=True)
url_banks = 'https://raw.githubusercontent.com/razorpay/ifsc/master/src/banknames.json'
req_b = urllib.request.urlopen(url_banks)
data_banks = json.loads(req_b.read().decode('utf-8'))

banks_batch = []
for code, name in data_banks.items():
    code_clean = str(code).strip().upper()
    name_clean = str(name).strip()
    ifsc_prefix = f"{code_clean}0"
    nodal_officer = f"Nodal Desk ({code_clean})"
    nodal_email = f"nodal.{code_clean.lower()}@fdrguardian.bank.in"
    banks_batch.append((code_clean, name_clean, ifsc_prefix, nodal_officer, nodal_email, True))

print(f"Batch inserting {len(banks_batch)} banks into Supabase...", flush=True)
execute_values(
    cur,
    """
    INSERT INTO banks (code, name, ifsc_prefix, nodal_officer, nodal_email, is_active)
    VALUES %s
    ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        ifsc_prefix = EXCLUDED.ifsc_prefix,
        is_active = EXCLUDED.is_active;
    """,
    banks_batch,
    page_size=500
)

cur.execute("SELECT count(*) FROM banks;")
total_banks = cur.fetchone()[0]
print(f"Total banks in Supabase now: {total_banks}", flush=True)

conn.close()
print("All districts and banks seeded successfully!", flush=True)
