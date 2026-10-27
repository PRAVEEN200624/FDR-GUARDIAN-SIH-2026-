import urllib.request
import json
import psycopg2

print("Connecting to Supabase PostgreSQL...", flush=True)
conn = psycopg2.connect(
    'postgresql://postgres.smyglbuwsbjzrvjglwjo:RmkecC12345612@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require',
    hostaddr='13.238.183.126'
)
conn.autocommit = True
cur = conn.cursor()

# 1. Fetch States from DB
cur.execute("SELECT id, name, code FROM states;")
states = cur.fetchall()
# Create normalized lookup: lowercase name -> id
db_states = {s[1].strip().lower(): s[0] for s in states}

# 2. Download all Indian districts JSON
print("Downloading all Indian States and Districts dataset...", flush=True)
url = 'https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json'
req = urllib.request.urlopen(url)
data = json.loads(req.read().decode('utf-8'))

districts_inserted = 0
for item in data['states']:
    raw_state_name = item['state'].strip()
    norm_name = raw_state_name.lower()
    
    # Matching state name
    state_id = db_states.get(norm_name)
    if not state_id:
        # Check partial or alias match
        for s_norm, s_id in db_states.items():
            if norm_name in s_norm or s_norm in norm_name:
                state_id = s_id
                break
    
    if not state_id:
        print(f"Skipping unknown state: {raw_state_name}")
        continue
    
    for dist in item['districts']:
        dist_name = dist.strip()
        code_prefix = dist_name[:3].upper()
        try:
            cur.execute("""
                INSERT INTO districts (state_id, name, code)
                VALUES (%s, %s, %s)
                ON CONFLICT (state_id, name) DO NOTHING;
            """, (state_id, dist_name, code_prefix))
            districts_inserted += 1
        except Exception as e:
            pass

cur.execute("SELECT count(*) FROM districts;")
total_in_db = cur.fetchone()[0]
print(f"Total districts in Supabase database now: {total_in_db} (processed {districts_inserted} districts)")
conn.close()
