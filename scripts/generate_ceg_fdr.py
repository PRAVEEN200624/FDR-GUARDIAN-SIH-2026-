import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

BASE_DIR = 'C:/Users/prave/.gemini/antigravity/scratch/fdr-guardian'
os.makedirs(os.path.join(BASE_DIR, 'public/sample-fdrs'), exist_ok=True)
pdf_path = os.path.join(BASE_DIR, 'public/sample-fdrs/FDR_College_of_Engineering_Guindy.pdf')

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations()
            super().showPage()
        super().save()

    def draw_decorations(self):
        self.saveState()
        # Security Guilloche / Decorative Outer Double Border
        self.setStrokeColor(colors.HexColor('#0c2340'))
        self.setLineWidth(3)
        self.rect(20, 20, 752, 572)
        self.setStrokeColor(colors.HexColor('#d97706'))
        self.setLineWidth(1)
        self.rect(25, 25, 742, 562)
        
        # Security Watermark
        self.setFont('Helvetica-Bold', 50)
        self.setFillColor(colors.HexColor('#f8fafc'))
        self.rotate(28)
        self.drawString(200, 60, 'SECURITY DEPOSIT - AICTE')
        self.restoreState()

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=landscape(letter),
    leftMargin=35,
    rightMargin=35,
    topMargin=35,
    bottomMargin=35
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'BankTitle',
    fontName='Helvetica-Bold',
    fontSize=18,
    leading=22,
    textColor=colors.HexColor('#0c2340'),
    alignment=1
)
subtitle_style = ParagraphStyle(
    'BankSubTitle',
    fontName='Helvetica',
    fontSize=9,
    leading=12,
    textColor=colors.HexColor('#334155'),
    alignment=1
)
cert_title = ParagraphStyle(
    'CertTitle',
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=16,
    textColor=colors.HexColor('#b45309'),
    alignment=1
)
cell_label = ParagraphStyle('CellLabel', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor('#475569'))
cell_val = ParagraphStyle('CellVal', fontName='Helvetica-Bold', fontSize=9, leading=11, textColor=colors.HexColor('#0f172a'))
cell_val_mono = ParagraphStyle('CellValMono', fontName='Courier-Bold', fontSize=9, leading=11, textColor=colors.HexColor('#0c2340'))
lien_style = ParagraphStyle(
    'LienStyle',
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=11,
    textColor=colors.HexColor('#991b1b'),
    alignment=0
)

elements = []

# Bank Header
elements.append(Paragraph('STATE BANK OF INDIA', title_style))
elements.append(Paragraph('Anna University Campus Branch (Code: 06463) &bull; Sardar Patel Road, Guindy, Chennai - 600025, Tamil Nadu<br/>IFSC: SBIN0006463 &bull; MICR: 600002005 &bull; Phone: 044-22351234 &bull; Email: sbi.06463@sbi.co.in', subtitle_style))
elements.append(Spacer(1, 10))

# Certificate Banner
banner_data = [[
    Paragraph('TERM DEPOSIT RECEIPT / SPECIAL FIXED DEPOSIT ADVICE<br/><font size=8 color="#1e3a8a">STATUTORY INSTITUTIONAL SECURITY DEPOSIT (AICTE REGULATORY COMPLIANCE)</font>', cert_title)
]]
banner_table = Table(banner_data, colWidths=[720])
banner_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef3c7')),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#d97706')),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
elements.append(banner_table)
elements.append(Spacer(1, 10))

# FDR Specific Key-Value Matrix
fdr_data = [
    [
        Paragraph('Receipt / Certificate No.:', cell_label),
        Paragraph('SBI-CEG-2024-FDR-984210', cell_val_mono),
        Paragraph('Account / Cust ID No.:', cell_label),
        Paragraph('39928174502 / CIF-778912', cell_val_mono)
    ],
    [
        Paragraph('Depositor / Institution Name:', cell_label),
        Paragraph('COLLEGE OF ENGINEERING, GUINDY (ANNA UNIVERSITY)', cell_val),
        Paragraph('AICTE Permanent Identifier:', cell_label),
        Paragraph('1-4067182501', cell_val_mono)
    ],
    [
        Paragraph('Joint Account Holder / Beneficiary:', cell_label),
        Paragraph('MEMBER SECRETARY, AICTE, NEW DELHI', cell_val),
        Paragraph('Deposit Category:', cell_label),
        Paragraph('PERMANENT SECURITY DEPOSIT', cell_val)
    ],
    [
        Paragraph('Principal Deposit Amount:', cell_label),
        Paragraph('₹ 35,00,000.00', cell_val_mono),
        Paragraph('Amount in Words:', cell_label),
        Paragraph('Rupees Thirty-Five Lakhs Only', cell_val)
    ],
    [
        Paragraph('Date of Deposit (Issue Date):', cell_label),
        Paragraph('2024-06-15', cell_val_mono),
        Paragraph('Date of Maturity:', cell_label),
        Paragraph('2029-06-15', cell_val_mono)
    ],
    [
        Paragraph('Deposit Tenure:', cell_label),
        Paragraph('60 Months (5.00 Years)', cell_val),
        Paragraph('Rate of Interest (% p.a.):', cell_label),
        Paragraph('7.10 % p.a. (Quarterly Compounding)', cell_val)
    ],
    [
        Paragraph('Maturity Amount Payable:', cell_label),
        Paragraph('₹ 49,68,950.00', cell_val_mono),
        Paragraph('Auto-Renewal Clause:', cell_label),
        Paragraph('Renewable with AICTE prior consent', cell_val)
    ],
]

fdr_table = Table(fdr_data, colWidths=[160, 200, 160, 200])
fdr_table.setStyle(TableStyle([
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
    ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f8fafc')),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(fdr_table)
elements.append(Spacer(1, 8))

# Statutory Lien Notice Box
lien_text = '''<b>MANDATORY STATUTORY LIEN NOTATION (REGULATORY COVENANT):</b><br/>
This Fixed Deposit Receipt is formally stamped and marked under irrevocable legal lien in favor of the <b>Member Secretary, All India Council for Technical Education (AICTE), New Delhi</b>. As per Statutory Regulation, this deposit shall not be liquidated, encashed, pledged, hypothecated, or transferred to any third party without explicit written No-Objection Concurrence issued under the seal of AICTE, New Delhi.'''

lien_table = Table([[Paragraph(lien_text, lien_style)]], colWidths=[720])
lien_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef2f2')),
    ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#ef4444')),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
]))
elements.append(lien_table)
elements.append(Spacer(1, 10))

# Signatures & Official Seals
sign_data = [
    [
        Paragraph('<b>Verified by System Specialist:</b><br/>Branch Officer / Maker<br/>Code: SBI-MAKER-4401<br/>Anna University Branch, Chennai', cell_label),
        Paragraph('<b>OFFICIAL CBS EMBLEM SEAL</b><br/>[ STATE BANK OF INDIA ]<br/>* GUINDY CHENNAI 600025 *', ParagraphStyle('Seal', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor('#1e40af'), alignment=1)),
        Paragraph('<b>Authorized Signatory / Approver:</b><br/>Chief Manager / Branch Head<br/>Signature Validated Digitally (PKI)<br/>State Bank of India', cell_label)
    ]
]
sign_table = Table(sign_data, colWidths=[240, 240, 240])
sign_table.setStyle(TableStyle([
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
    ('ALIGN', (1,0), (1,-1), 'CENTER'),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
elements.append(sign_table)

doc.build(elements, canvasmaker=NumberedCanvas)
print('SUCCESS! Generated authentic FDR PDF:', pdf_path)
