# ==============================================================================
# FDR GUARDIAN: SUPABASE POSTGRESQL MIGRATION & SEED RUNNER
# File: database/seed_data.py
# ==============================================================================

import os
import psycopg2
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.smyglbuwsbjzrvjglwjo:RmkecC12345612@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
)

def run_migrations_and_seed():
    print("Connecting to Supabase PostgreSQL Session Pooler...", flush=True)
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Apply Schema
    migration_path = os.path.join(os.path.dirname(__file__), "migrations", "001_initial_schema.sql")
    print(f"Applying schema from {migration_path}...", flush=True)
    with open(migration_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cur.execute(schema_sql)
    print("Schema applied successfully.", flush=True)

    # 2. Seed States
    print("Seeding Indian States & Union Territories...", flush=True)
    states_data = [
        ("Andhra Pradesh", "AP"),
        ("Arunachal Pradesh", "AR"),
        ("Assam", "AS"),
        ("Bihar", "BR"),
        ("Chhattisgarh", "CG"),
        ("Goa", "GA"),
        ("Gujarat", "GJ"),
        ("Haryana", "HR"),
        ("Himachal Pradesh", "HP"),
        ("Jharkhand", "JH"),
        ("Karnataka", "KA"),
        ("Kerala", "KL"),
        ("Madhya Pradesh", "MP"),
        ("Maharashtra", "MH"),
        ("Manipur", "MN"),
        ("Meghalaya", "ML"),
        ("Mizoram", "MZ"),
        ("Nagaland", "NL"),
        ("Odisha", "OD"),
        ("Punjab", "PB"),
        ("Rajasthan", "RJ"),
        ("Sikkim", "SK"),
        ("Tamil Nadu", "TN"),
        ("Telangana", "TS"),
        ("Tripura", "TR"),
        ("Uttar Pradesh", "UP"),
        ("Uttarakhand", "UK"),
        ("West Bengal", "WB"),
        ("Andaman and Nicobar Islands", "AN"),
        ("Chandigarh", "CH"),
        ("Dadra and Nagar Haveli and Daman and Diu", "DH"),
        ("Delhi", "DL"),
        ("Jammu and Kashmir", "JK"),
        ("Ladakh", "LA"),
        ("Lakshadweep", "LD"),
        ("Puducherry", "PY"),
    ]

    for name, code in states_data:
        cur.execute("""
            INSERT INTO states (name, code, country_code)
            VALUES (%s, %s, 'IN')
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
        """, (name, code))

    # Fetch states mapping {code: id}
    cur.execute("SELECT code, id FROM states;")
    state_map = dict(cur.fetchall())

    # 3. Seed Districts
    print("Seeding Districts...")
    districts_data = [
        # Maharashtra (MH)
        (state_map["MH"], "Mumbai City", "MUM-C"),
        (state_map["MH"], "Mumbai Suburban", "MUM-S"),
        (state_map["MH"], "Pune", "PUN"),
        (state_map["MH"], "Nagpur", "NAG"),
        (state_map["MH"], "Thane", "THA"),
        (state_map["MH"], "Nashik", "NAS"),
        (state_map["MH"], "Aurangabad", "AUR"),
        # Delhi (DL)
        (state_map["DL"], "New Delhi", "NDL"),
        (state_map["DL"], "South Delhi", "SDL"),
        (state_map["DL"], "North Delhi", "NOD"),
        (state_map["DL"], "Central Delhi", "CDL"),
        # Karnataka (KA)
        (state_map["KA"], "Bengaluru Urban", "BLR-U"),
        (state_map["KA"], "Bengaluru Rural", "BLR-R"),
        (state_map["KA"], "Mysuru", "MYS"),
        (state_map["KA"], "Dakshina Kannada", "DKN"),
        (state_map["KA"], "Dharwad", "DHD"),
        # Tamil Nadu (TN)
        (state_map["TN"], "Chennai", "CHN"),
        (state_map["TN"], "Coimbatore", "CBE"),
        (state_map["TN"], "Madurai", "MDU"),
        (state_map["TN"], "Tiruchirappalli", "TRY"),
        (state_map["TN"], "Kanchipuram", "KPM"),
        # Uttar Pradesh (UP)
        (state_map["UP"], "Gautam Buddha Nagar (Noida)", "GBN"),
        (state_map["UP"], "Lucknow", "LKO"),
        (state_map["UP"], "Kanpur Nagar", "KNP"),
        (state_map["UP"], "Varanasi", "VNS"),
        (state_map["UP"], "Prayagraj", "PRY"),
        # Odisha (OD)
        (state_map["OD"], "Khordha (Bhubaneswar)", "KHD"),
        (state_map["OD"], "Cuttack", "CTC"),
        (state_map["OD"], "Sundargarh (Rourkela)", "SNG"),
        # Telangana (TS)
        (state_map["TS"], "Hyderabad", "HYD"),
        (state_map["TS"], "Rangareddy", "RGD"),
        (state_map["TS"], "Medchal-Malkajgiri", "MDM"),
        # Gujarat (GJ)
        (state_map["GJ"], "Ahmedabad", "AMD"),
        (state_map["GJ"], "Gandhinagar", "GDN"),
        (state_map["GJ"], "Vadodara", "VDR"),
        (state_map["GJ"], "Surat", "SUR"),
        # West Bengal (WB)
        (state_map["WB"], "Kolkata", "KOL"),
        (state_map["WB"], "North 24 Parganas", "N24"),
        (state_map["WB"], "Howrah", "HWH"),
    ]

    for state_id, dist_name, dist_code in districts_data:
        cur.execute("""
            INSERT INTO districts (state_id, name, code)
            VALUES (%s, %s, %s)
            ON CONFLICT (state_id, name) DO UPDATE SET code = EXCLUDED.code;
        """, (state_id, dist_name, dist_code))

    # Fetch districts mapping {(state_id, name): id}
    cur.execute("SELECT state_id, name, id FROM districts;")
    dist_map = {(row[0], row[1]): row[2] for row in cur.fetchall()}

    # 4. Seed Banks
    print("Seeding Scheduled Commercial Banks...")
    banks_data = [
        ("SBI", "State Bank of India", "SBIN0", "Shri S. K. Narayanan", "nodal.sbi@fdrguardian.demo.gov.in"),
        ("PNB", "Punjab National Bank", "PUNB0", "Ms. Ananya Deshmukh", "nodal.pnb@fdrguardian.demo.gov.in"),
        ("CNRB", "Canara Bank", "CNRB0", "Shri R. Venkatraman", "nodal.canara@fdrguardian.demo.gov.in"),
        ("BARB", "Bank of Baroda", "BARB0", "Shri Pradeep Mehta", "nodal.bob@fdrguardian.demo.gov.in"),
        ("UBIN", "Union Bank of India", "UBIN0", "Shri Alok Kashyap", "nodal.union@fdrguardian.demo.gov.in"),
        ("HDFC", "HDFC Bank Ltd.", "HDFC0", "Ms. Ritu Tandon", "nodal.hdfc@fdrguardian.demo.gov.in"),
        ("ICIC", "ICICI Bank Ltd.", "ICIC0", "Shri Manish Agarwal", "nodal.icici@fdrguardian.demo.gov.in"),
    ]

    for code, name, ifsc, nodal_name, nodal_email in banks_data:
        cur.execute("""
            INSERT INTO banks (code, name, ifsc_prefix, nodal_officer, nodal_email)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                ifsc_prefix = EXCLUDED.ifsc_prefix,
                nodal_officer = EXCLUDED.nodal_officer,
                nodal_email = EXCLUDED.nodal_email;
        """, (code, name, ifsc, nodal_name, nodal_email))

    cur.execute("SELECT code, id FROM banks;")
    bank_map = dict(cur.fetchall())

    # 5. Seed Institutions
    print("Seeding Educational Institutions...")
    institutions_data = [
        # Odisha
        ("Kalinga Institute of Technology", "1-1099238411", "ENGINEERING", state_map["OD"], dist_map[(state_map["OD"], "Khordha (Bhubaneswar)")], "Campus 3, Patia, Bhubaneswar, Odisha 751024"),
        ("CV Raman Global University", "1-1099238412", "UNIVERSITY", state_map["OD"], dist_map[(state_map["OD"], "Khordha (Bhubaneswar)")], "Bidyanagar, Mahura, Janla, Bhubaneswar, Odisha 752054"),
        ("National Institute of Technology Rourkela", "1-1099238413", "ENGINEERING", state_map["OD"], dist_map[(state_map["OD"], "Sundargarh (Rourkela)")], "Sector 1, Rourkela, Odisha 769008"),
        
        # Maharashtra
        ("College of Engineering Pune (COEP)", "1-2049182301", "ENGINEERING", state_map["MH"], dist_map[(state_map["MH"], "Pune")], "Wellesley Road, Shivajinagar, Pune, Maharashtra 411005"),
        ("Veermata Jijabai Technological Institute (VJTI)", "1-2049182302", "ENGINEERING", state_map["MH"], dist_map[(state_map["MH"], "Mumbai City")], "H R Mahajani Marg, Matunga, Mumbai, Maharashtra 400019"),
        ("Sardar Patel Institute of Technology", "1-2049182303", "ENGINEERING", state_map["MH"], dist_map[(state_map["MH"], "Mumbai Suburban")], "Bhavans Campus, Munshi Nagar, Andheri West, Mumbai, Maharashtra 400058"),
        
        # Karnataka
        ("R.V. College of Engineering", "1-3058192401", "ENGINEERING", state_map["KA"], dist_map[(state_map["KA"], "Bengaluru Urban")], "Mysore Road, RV Vidyaniketan Post, Bengaluru, Karnataka 560059"),
        ("BMS College of Engineering", "1-3058192402", "ENGINEERING", state_map["KA"], dist_map[(state_map["KA"], "Bengaluru Urban")], "Bull Temple Road, Basavanagudi, Bengaluru, Karnataka 560019"),
        ("Manipal Institute of Technology", "1-3058192403", "UNIVERSITY", state_map["KA"], dist_map[(state_map["KA"], "Dakshina Kannada")], "Eshwar Nagar, Manipal, Udupi / Dakshina Kannada, Karnataka 576104"),
        
        # Tamil Nadu
        ("College of Engineering, Guindy (Anna University)", "1-4067182501", "UNIVERSITY", state_map["TN"], dist_map[(state_map["TN"], "Chennai")], "12 Sardar Patel Road, Guindy, Chennai, Tamil Nadu 600025"),
        ("PSG College of Technology", "1-4067182502", "ENGINEERING", state_map["TN"], dist_map[(state_map["TN"], "Coimbatore")], "Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu 641004"),
        
        # Delhi
        ("Delhi Technological University (DTU)", "1-5076192601", "UNIVERSITY", state_map["DL"], dist_map[(state_map["DL"], "North Delhi")], "Shahbad Daulatpur, Bawana Road, Delhi 110042"),
        ("Netaji Subhas University of Technology (NSUT)", "1-5076192602", "UNIVERSITY", state_map["DL"], dist_map[(state_map["DL"], "South Delhi")], "Sector 3, Dwarka, New Delhi 110078"),
        
        # Uttar Pradesh
        ("JSS Academy of Technical Education", "1-6085192701", "ENGINEERING", state_map["UP"], dist_map[(state_map["UP"], "Gautam Buddha Nagar (Noida)")], "C-20/1, Sector 62, Noida, Uttar Pradesh 201301"),
        ("Institute of Engineering and Technology Lucknow", "1-6085192702", "ENGINEERING", state_map["UP"], dist_map[(state_map["UP"], "Lucknow")], "Sitapur Road, Sector F, Jankipuram, Lucknow, Uttar Pradesh 226021"),
    ]

    inst_map = {}
    for inst_name, code, inst_type, st_id, dist_id, addr in institutions_data:
        cur.execute("""
            INSERT INTO institutions (institution_name, institution_code, institution_type, state_id, district_id, address)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (institution_code) DO UPDATE SET
                institution_name = EXCLUDED.institution_name,
                address = EXCLUDED.address
            RETURNING id;
        """, (inst_name, code, inst_type, st_id, dist_id, addr))
        inst_map[code] = cur.fetchone()[0]

    # 6. Seed Profiles & Passwords (bcrypt hashed)
    print("Seeding User Profiles...")
    default_password_hash = pwd_context.hash("Demo@1234")

    users_data = [
        # (email, full_name, mobile, role, account_status)
        ("admin@fdrguardian.demo.gov.in", "Vikramaditya Roy", "+91 98110 02144", "system_admin", "approved"),
        ("registrar@kalinga-tech.edu.in", "Dr. Rajesh Sharma", "+91 98450 11223", "institution_user", "approved"),
        ("amitav.sengupta@sbi.co.in", "Amitav Sengupta", "+91 98200 44332", "bank_officer", "approved"),
        ("meenakshi.sundaram@aicte-india.org", "Smt. Meenakshi Sundaram", "+91 94440 99881", "regulatory_officer", "approved"),
        # Pending approvals
        ("priya.sharma@aicte-india.org", "Priya Sharma", "+91 98765 43210", "regulatory_officer", "pending_approval"),
        ("vikram.verma@bankofbaroda.com", "Vikram Verma", "+91 98111 22334", "bank_officer", "pending_approval"),
    ]

    user_ids = {}
    for email, full_name, mobile, role, status in users_data:
        cur.execute("""
            INSERT INTO profiles (full_name, email, mobile_number, hashed_password, role, account_status)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (email) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role,
                account_status = EXCLUDED.account_status,
                hashed_password = EXCLUDED.hashed_password
            RETURNING id;
        """, (full_name, email, mobile, default_password_hash, role, status))
        user_ids[email] = cur.fetchone()[0]

    # Link Role Profiles
    # Institution User
    kalinga_id = inst_map["1-1099238411"]
    cur.execute("""
        INSERT INTO institution_profiles (user_id, institution_id, designation, verification_status)
        VALUES (%s, %s, 'Registrar & Authorized Signatory', 'verified')
        ON CONFLICT (user_id) DO UPDATE SET institution_id = EXCLUDED.institution_id;
    """, (user_ids["registrar@kalinga-tech.edu.in"], kalinga_id))

    # Bank Officers
    cur.execute("""
        INSERT INTO bank_officer_profiles (user_id, bank_name, branch_or_office, designation, employee_id, verification_status)
        VALUES (%s, 'State Bank of India', 'Institutional Banking Hub, Bhubaneswar', 'Chief Manager (Institutional)', 'SBI-EMP-44910', 'verified')
        ON CONFLICT (user_id) DO UPDATE SET bank_name = EXCLUDED.bank_name;
    """, (user_ids["amitav.sengupta@sbi.co.in"],))

    cur.execute("""
        INSERT INTO bank_officer_profiles (user_id, bank_name, branch_or_office, designation, employee_id, verification_status)
        VALUES (%s, 'Bank of Baroda', 'Zonal Office, Nariman Point, Mumbai', 'Senior Manager (Credit)', 'BOB-88301', 'pending')
        ON CONFLICT (user_id) DO UPDATE SET bank_name = EXCLUDED.bank_name;
    """, (user_ids["vikram.verma@bankofbaroda.com"],))

    # Regulatory Officers
    cur.execute("""
        INSERT INTO regulatory_officer_profiles (user_id, designation, office_or_jurisdiction, employee_reference, verification_status)
        VALUES (%s, 'Director (Approvals Bureau)', 'AICTE Headquarters, New Delhi', 'AICTE-DIR-2018-092', 'verified')
        ON CONFLICT (user_id) DO UPDATE SET designation = EXCLUDED.designation;
    """, (user_ids["meenakshi.sundaram@aicte-india.org"],))

    cur.execute("""
        INSERT INTO regulatory_officer_profiles (user_id, designation, office_or_jurisdiction, employee_reference, verification_status)
        VALUES (%s, 'Assistant Director', 'Western Regional Office (WRO), Mumbai', 'AICTE-WRO-2024-118', 'pending')
        ON CONFLICT (user_id) DO UPDATE SET designation = EXCLUDED.designation;
    """, (user_ids["priya.sharma@aicte-india.org"],))

    # Seed Access Requests for Pending Officers
    print("Seeding Access Requests...")
    cur.execute("""
        INSERT INTO access_requests (user_id, requested_role, status, review_notes)
        VALUES 
            (%s, 'regulatory_officer', 'pending', 'Submitted AICTE WRO appointment order ref AICTE/WRO/2026/F-92 awaiting administrative verification.'),
            (%s, 'bank_officer', 'pending', 'Bank of Baroda zonal authorization letter BOB/ZL/2026/04 attached, awaiting verification.')
        ON CONFLICT DO NOTHING;
    """, (user_ids["priya.sharma@aicte-india.org"], user_ids["vikram.verma@bankofbaroda.com"]))

    # 7. Seed Sample FDRs
    print("Seeding Sample Fixed Deposit Receipts...")
    sbi_id = bank_map["SBI"]
    pnb_id = bank_map["PNB"]
    canara_id = bank_map["CNRB"]

    fdrs_data = [
        ("FDR-2024-SBI-7741", "pub-vfy-sbi-7741-9a4f", kalinga_id, sbi_id, "Bhubaneswar Main Branch (00041)", "Kalinga Institute of Technology", "AICTE Joint Lien", 3500000.00, "2024-03-15", "2029-03-15", 60, 7.25, "PERMANENT_SECURITY", "AICTE New Delhi", "Approved", 98.5, 5, user_ids["registrar@kalinga-tech.edu.in"]),
        ("FDR-2025-PNB-8820", "pub-vfy-pnb-8820-2b1c", kalinga_id, pnb_id, "Janpath Market Branch, Bhubaneswar", "Kalinga Institute of Technology", "AICTE Security Deposit", 1500000.00, "2025-01-10", "2028-01-10", 36, 7.10, "COURSE_AFFILIATION", "Member Secretary, AICTE", "Bank_Verified", 96.0, 5, user_ids["registrar@kalinga-tech.edu.in"]),
        ("FDR-2025-CNRB-4412", "pub-vfy-cnrb-4412-3f8d", kalinga_id, canara_id, "Saheed Nagar Branch, Bhubaneswar", "Kalinga Institute of Technology", "AICTE Endowment Fund", 2500000.00, "2025-06-20", "2030-06-20", 60, 7.40, "ENDOWMENT", "AICTE New Delhi", "Submitted", 94.2, 5, user_ids["registrar@kalinga-tech.edu.in"]),
        ("FDR-2023-SBI-1190", "pub-vfy-sbi-1190-4e7a", kalinga_id, sbi_id, "Patia Institutional Area, Bhubaneswar", "Kalinga Institute of Technology", "AICTE Joint Lien", 5000000.00, "2023-11-01", "2026-11-01", 36, 7.50, "INFRASTRUCTURE_FUND", "AICTE New Delhi", "Approved", 99.0, 5, user_ids["registrar@kalinga-tech.edu.in"]),
    ]

    fdr_ids = []
    for fdr_num, pub_id, inst_id, b_id, br_name, h_name, j_name, amt, iss_date, mat_date, tenure, rate, cat, lien, status, ocr, target, sub_by in fdrs_data:
        cur.execute("""
            INSERT INTO fdrs (
                fdr_number, public_verification_id, institution_id, bank_id, branch_name,
                holder_name, joint_holder_name, principal_amount, issue_date, maturity_date,
                tenure_months, interest_rate, deposit_category, lien_marked_to, status,
                ocr_confidence_average, service_target_days, submitted_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (fdr_number, bank_id) DO UPDATE SET status = EXCLUDED.status
            RETURNING id;
        """, (fdr_num, pub_id, inst_id, b_id, br_name, h_name, j_name, amt, iss_date, mat_date, tenure, rate, cat, lien, status, ocr, target, sub_by))
        fdr_ids.append(cur.fetchone()[0])

    # 8. Seed Bank Verifications
    print("Seeding Bank Verifications...")
    cur.execute("""
        INSERT INTO bank_verifications (fdr_id, status, reference_number, officer_id, comments, supporting_evidence_url)
        VALUES 
            (%s, 'CONFIRMED', 'CBS-SBI-BBSR-2024-99812', %s, 'Deposit verified in Core Banking Solution ledger. Joint lien marked in favour of AICTE New Delhi as per mandate.', 'https://sbi.co.in/cbs-audit/vfy-7741.pdf'),
            (%s, 'CONFIRMED', 'CBS-PNB-2025-44102', %s, 'Fixed deposit receipt verified against PNB Finacle CBS. Principal and tenure confirmed.', 'https://pnbindia.in/cbs/vfy-8820.pdf')
        ON CONFLICT DO NOTHING;
    """, (fdr_ids[0], user_ids["amitav.sengupta@sbi.co.in"], fdr_ids[1], user_ids["amitav.sengupta@sbi.co.in"]))

    # 9. Seed Regulatory Decisions
    print("Seeding Regulatory Decisions...")
    cur.execute("""
        INSERT INTO regulatory_decisions (fdr_id, status, reviewer_id, decision_reason, conditions_json)
        VALUES 
            (%s, 'APPROVED', %s, 'Statutory verification complete. Bank verification confirmed under reference CBS-SBI-BBSR-2024-99812 with mandatory lien marked.', '{"lien_valid": true, "tenure_compliant": true, "bank_confirmed": true}')
        ON CONFLICT DO NOTHING;
    """, (fdr_ids[0], user_ids["meenakshi.sundaram@aicte-india.org"]))

    # 10. Seed Notifications
    print("Seeding Initial Notifications...")
    cur.execute("""
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES 
            (%s, 'Welcome to FDR Guardian', 'Your institutional account for Kalinga Institute of Technology is active.', 'SUCCESS', true),
            (%s, 'FDR Verification Confirmed', 'State Bank of India confirmed verification for FDR-2024-SBI-7741.', 'INFO', false),
            (%s, 'Pending Access Requests Awaiting Review', '2 privileged role registration requests are awaiting administrative decision.', 'WARNING', false)
        ON CONFLICT DO NOTHING;
    """, (user_ids["registrar@kalinga-tech.edu.in"], user_ids["registrar@kalinga-tech.edu.in"], user_ids["admin@fdrguardian.demo.gov.in"]))

    # 11. Seed Audit Logs
    print("Seeding Initial Audit Trail...")
    cur.execute("""
        INSERT INTO audit_logs (actor_user_id, actor_name, actor_role, action, entity_type, entity_id, details)
        VALUES 
            (%s, 'System Bootstrapper', 'system_admin', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'BOOTSTRAP', '{"event": "Supabase database schema migration and reference data seed completed"}'),
            (%s, 'Dr. Rajesh Sharma', 'institution_user', 'FDR_SUBMISSION', 'FDR', %s, '{"fdr_number": "FDR-2024-SBI-7741", "amount": 3500000}'),
            (%s, 'Amitav Sengupta', 'bank_officer', 'BANK_VERIFICATION_CONFIRMED', 'FDR', %s, '{"cbs_reference": "CBS-SBI-BBSR-2024-99812", "status": "CONFIRMED"}'),
            (%s, 'Smt. Meenakshi Sundaram', 'regulatory_officer', 'REGULATORY_APPROVAL_GRANTED', 'FDR', %s, '{"decision": "APPROVED", "reason": "Statutory requirements fulfilled"}');
    """, (
        user_ids["admin@fdrguardian.demo.gov.in"],
        user_ids["registrar@kalinga-tech.edu.in"], str(fdr_ids[0]),
        user_ids["amitav.sengupta@sbi.co.in"], str(fdr_ids[0]),
        user_ids["meenakshi.sundaram@aicte-india.org"], str(fdr_ids[0])
    ))

    cur.close()
    conn.close()
    print("Database initialization and seed complete!")

if __name__ == "__main__":
    run_migrations_and_seed()
