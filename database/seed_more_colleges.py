import psycopg2

conn = psycopg2.connect(
    'postgresql://postgres.smyglbuwsbjzrvjglwjo:RmkecC12345612@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require',
    hostaddr='13.238.183.126'
)
conn.autocommit = True
cur = conn.cursor()

# 1. Get States
cur.execute("SELECT code, id FROM states;")
state_map = dict(cur.fetchall())
tn_id = state_map['TN']

# 2. Add Thiruvallur to Tamil Nadu
cur.execute("""
    INSERT INTO districts (state_id, name, code)
    VALUES (%s, 'Thiruvallur', 'TLR')
    ON CONFLICT (state_id, name) DO NOTHING;
""", (tn_id,))

# Get districts
cur.execute("SELECT state_id, name, id FROM districts;")
dist_map = {(r[0], r[1]): r[2] for r in cur.fetchall()}

# 3. Add colleges
colleges = [
    ('R.M.K. Engineering College (RMKEC)', '1-10901234', 'ENGINEERING', tn_id, dist_map[(tn_id, 'Thiruvallur')], 'RSM Nagar, Kavaraipettai, Gummidipoondi, Thiruvallur, Tamil Nadu 601206'),
    ('R.M.D. Engineering College', '1-10901235', 'ENGINEERING', tn_id, dist_map[(tn_id, 'Thiruvallur')], 'RSM Nagar, Kavaraipettai, Thiruvallur, Tamil Nadu 601206'),
    ('Vel Tech Rangarajan Dr. Sagunthala R&D Institute', '1-10901236', 'UNIVERSITY', tn_id, dist_map[(tn_id, 'Thiruvallur')], '400 Feet Outer Ring Road, Avadi, Tamil Nadu 600062'),
    ('IIT Madras (Indian Institute of Technology)', '1-4067182510', 'UNIVERSITY', tn_id, dist_map[(tn_id, 'Chennai')], 'Sardar Patel Road, Chennai, Tamil Nadu 600036'),
    ('SSN College of Engineering', '1-4067182511', 'ENGINEERING', tn_id, dist_map[(tn_id, 'Chennai')], 'Rajiv Gandhi Salai (OMR), Kalavakkam, Chennai 603110'),
    ('Madras Institute of Technology (MIT Campus)', '1-4067182512', 'ENGINEERING', tn_id, dist_map[(tn_id, 'Chennai')], 'Chromepet, Chennai, Tamil Nadu 600044'),
    ('Thiagarajar College of Engineering', '1-4067182540', 'ENGINEERING', tn_id, dist_map[(tn_id, 'Madurai')], 'Thiruparankundram, Madurai 625015'),
    ('NIT Tiruchirappalli', '1-4067182550', 'UNIVERSITY', tn_id, dist_map[(tn_id, 'Tiruchirappalli')], 'Tanjore Main Road, Tiruchirappalli 620015'),
]

for name, code, itype, sid, did, addr in colleges:
    cur.execute("""
        INSERT INTO institutions (institution_name, institution_code, institution_type, state_id, district_id, address)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (institution_code) DO UPDATE SET
            institution_name = EXCLUDED.institution_name,
            district_id = EXCLUDED.district_id,
            address = EXCLUDED.address;
    """, (name, code, itype, sid, did, addr))

print(f"Successfully seeded {len(colleges)} colleges into Supabase!")
conn.close()
