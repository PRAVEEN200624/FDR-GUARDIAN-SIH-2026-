import { StateItem, DistrictItem, InstitutionItem, BankItem } from './api';

export const DEFAULT_STATES: StateItem[] = [
  { id: 23, name: 'Tamil Nadu', code: 'TN', country_code: 'IN' },
  { id: 14, name: 'Maharashtra', code: 'MH', country_code: 'IN' },
  { id: 11, name: 'Karnataka', code: 'KA', country_code: 'IN' },
  { id: 32, name: 'Delhi', code: 'DL', country_code: 'IN' },
  { id: 26, name: 'Uttar Pradesh', code: 'UP', country_code: 'IN' },
  { id: 19, name: 'Odisha', code: 'OD', country_code: 'IN' },
  { id: 24, name: 'Telangana', code: 'TS', country_code: 'IN' },
  { id: 1, name: 'Andhra Pradesh', code: 'AP', country_code: 'IN' },
  { id: 7, name: 'Gujarat', code: 'GJ', country_code: 'IN' },
  { id: 12, name: 'Kerala', code: 'KL', country_code: 'IN' },
  { id: 28, name: 'West Bengal', code: 'WB', country_code: 'IN' },
  { id: 20, name: 'Punjab', code: 'PB', country_code: 'IN' },
  { id: 21, name: 'Rajasthan', code: 'RJ', country_code: 'IN' },
  { id: 13, name: 'Madhya Pradesh', code: 'MP', country_code: 'IN' },
  { id: 4, name: 'Bihar', code: 'BR', country_code: 'IN' },
  { id: 8, name: 'Haryana', code: 'HR', country_code: 'IN' },
  { id: 2, name: 'Arunachal Pradesh', code: 'AR', country_code: 'IN' },
  { id: 3, name: 'Assam', code: 'AS', country_code: 'IN' },
  { id: 5, name: 'Chhattisgarh', code: 'CG', country_code: 'IN' },
  { id: 6, name: 'Goa', code: 'GA', country_code: 'IN' },
  { id: 9, name: 'Himachal Pradesh', code: 'HP', country_code: 'IN' },
  { id: 10, name: 'Jharkhand', code: 'JH', country_code: 'IN' },
  { id: 15, name: 'Manipur', code: 'MN', country_code: 'IN' },
  { id: 16, name: 'Meghalaya', code: 'ML', country_code: 'IN' },
  { id: 17, name: 'Mizoram', code: 'MZ', country_code: 'IN' },
  { id: 18, name: 'Nagaland', code: 'NL', country_code: 'IN' },
  { id: 22, name: 'Sikkim', code: 'SK', country_code: 'IN' },
  { id: 25, name: 'Tripura', code: 'TR', country_code: 'IN' },
  { id: 27, name: 'Uttarakhand', code: 'UK', country_code: 'IN' },
  { id: 29, name: 'Andaman and Nicobar Islands', code: 'AN', country_code: 'IN' },
  { id: 30, name: 'Chandigarh', code: 'CH', country_code: 'IN' },
  { id: 31, name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DH', country_code: 'IN' },
  { id: 33, name: 'Jammu and Kashmir', code: 'JK', country_code: 'IN' },
  { id: 34, name: 'Ladakh', code: 'LA', country_code: 'IN' },
  { id: 35, name: 'Lakshadweep', code: 'LD', country_code: 'IN' },
  { id: 36, name: 'Puducherry', code: 'PY', country_code: 'IN' },
];

export const DEFAULT_BANKS: BankItem[] = [
  { id: 'bank-sbi', code: 'SBIN', name: 'State Bank of India', ifsc_prefix: 'SBIN0', is_active: true },
  { id: 'bank-pnb', code: 'PUNB', name: 'Punjab National Bank', ifsc_prefix: 'PUNB0', is_active: true },
  { id: 'bank-canara', code: 'CNRB', name: 'Canara Bank', ifsc_prefix: 'CNRB0', is_active: true },
  { id: 'bank-bob', code: 'BARB', name: 'Bank of Baroda', ifsc_prefix: 'BARB0', is_active: true },
  { id: 'bank-union', code: 'UBIN', name: 'Union Bank of India', ifsc_prefix: 'UBIN0', is_active: true },
  { id: 'bank-hdfc', code: 'HDFC', name: 'HDFC Bank Ltd.', ifsc_prefix: 'HDFC0', is_active: true },
  { id: 'bank-icici', code: 'ICIC', name: 'ICICI Bank Ltd.', ifsc_prefix: 'ICIC0', is_active: true },
  { id: 'bank-axis', code: 'UTIB', name: 'Axis Bank Ltd.', ifsc_prefix: 'UTIB0', is_active: true },
  { id: 'bank-kotak', code: 'KKBK', name: 'Kotak Mahindra Bank', ifsc_prefix: 'KKBK0', is_active: true },
  { id: 'bank-indusind', code: 'INDB', name: 'IndusInd Bank', ifsc_prefix: 'INDB0', is_active: true },
  { id: 'bank-indian', code: 'IDIB', name: 'Indian Bank', ifsc_prefix: 'IDIB0', is_active: true },
  { id: 'bank-central', code: 'CBIN', name: 'Central Bank of India', ifsc_prefix: 'CBIN0', is_active: true },
  { id: 'bank-iob', code: 'IOBA', name: 'Indian Overseas Bank', ifsc_prefix: 'IOBA0', is_active: true },
  { id: 'bank-uco', code: 'UCBA', name: 'UCO Bank', ifsc_prefix: 'UCBA0', is_active: true },
  { id: 'bank-bom', code: 'MAHB', name: 'Bank of Maharashtra', ifsc_prefix: 'MAHB0', is_active: true },
  { id: 'bank-psb', code: 'PSIB', name: 'Punjab & Sind Bank', ifsc_prefix: 'PSIB0', is_active: true },
  { id: 'bank-idbi', code: 'IBKL', name: 'IDBI Bank', ifsc_prefix: 'IBKL0', is_active: true },
  { id: 'bank-yes', code: 'YESB', name: 'Yes Bank Ltd.', ifsc_prefix: 'YESB0', is_active: true },
  { id: 'bank-federal', code: 'FDRL', name: 'Federal Bank', ifsc_prefix: 'FDRL0', is_active: true },
  { id: 'bank-idfc', code: 'IDFB', name: 'IDFC FIRST Bank', ifsc_prefix: 'IDFB0', is_active: true },
  { id: 'bank-bandhan', code: 'BDBL', name: 'Bandhan Bank', ifsc_prefix: 'BDBL0', is_active: true },
  { id: 'bank-au', code: 'AUBL', name: 'AU Small Finance Bank', ifsc_prefix: 'AUBL0', is_active: true },
  { id: 'bank-equitas', code: 'ESFB', name: 'Equitas Small Finance Bank', ifsc_prefix: 'ESFB0', is_active: true },
];

export const FALLBACK_DISTRICTS: Record<number, DistrictItem[]> = {
  // Tamil Nadu (23)
  23: [
    { id: 2301, state_id: 23, name: 'Thiruvallur', code: 'TLR' },
    { id: 2302, state_id: 23, name: 'Chennai', code: 'CHN' },
    { id: 2303, state_id: 23, name: 'Coimbatore', code: 'CBE' },
    { id: 2304, state_id: 23, name: 'Madurai', code: 'MDU' },
    { id: 2305, state_id: 23, name: 'Tiruchirappalli', code: 'TRY' },
    { id: 2306, state_id: 23, name: 'Kanchipuram', code: 'KPM' },
    { id: 2307, state_id: 23, name: 'Salem', code: 'SLM' },
    { id: 2308, state_id: 23, name: 'Tirunelveli', code: 'TNV' },
    { id: 2309, state_id: 23, name: 'Vellore', code: 'VEL' },
    { id: 2310, state_id: 23, name: 'Erode', code: 'ERO' },
  ],
  // Maharashtra (14)
  14: [
    { id: 1401, state_id: 14, name: 'Pune', code: 'PUN' },
    { id: 1402, state_id: 14, name: 'Mumbai City', code: 'MUM-C' },
    { id: 1403, state_id: 14, name: 'Mumbai Suburban', code: 'MUM-S' },
    { id: 1404, state_id: 14, name: 'Nagpur', code: 'NAG' },
    { id: 1405, state_id: 14, name: 'Thane', code: 'THA' },
    { id: 1406, state_id: 14, name: 'Nashik', code: 'NAS' },
  ],
  // Karnataka (11)
  11: [
    { id: 1101, state_id: 11, name: 'Bengaluru Urban', code: 'BLR-U' },
    { id: 1102, state_id: 11, name: 'Bengaluru Rural', code: 'BLR-R' },
    { id: 1103, state_id: 11, name: 'Mysuru', code: 'MYS' },
    { id: 1104, state_id: 11, name: 'Dakshina Kannada', code: 'DKN' },
    { id: 1105, state_id: 11, name: 'Dharwad', code: 'DHD' },
  ],
  // Delhi (32)
  32: [
    { id: 3201, state_id: 32, name: 'New Delhi', code: 'NDL' },
    { id: 3202, state_id: 32, name: 'South Delhi', code: 'SDL' },
    { id: 3203, state_id: 32, name: 'North Delhi', code: 'NOD' },
    { id: 3204, state_id: 32, name: 'Central Delhi', code: 'CDL' },
    { id: 3205, state_id: 32, name: 'West Delhi', code: 'WDL' },
  ],
  // Odisha (19)
  19: [
    { id: 1901, state_id: 19, name: 'Khordha (Bhubaneswar)', code: 'KHD' },
    { id: 1902, state_id: 19, name: 'Cuttack', code: 'CTC' },
    { id: 1903, state_id: 19, name: 'Sundargarh (Rourkela)', code: 'SNG' },
  ]
};

export const FALLBACK_COLLEGES: Record<string, InstitutionItem[]> = {
  // Key: `${state_id}-${district_id}`
  '23-2301': [
    { id: 'inst-rmkec', institution_name: 'R.M.K. Engineering College (RMKEC)', institution_code: '1-10901234', institution_type: 'ENGINEERING', state_id: 23, district_id: 2301, is_active: true },
    { id: 'inst-rmd', institution_name: 'R.M.D. Engineering College', institution_code: '1-10901235', institution_type: 'ENGINEERING', state_id: 23, district_id: 2301, is_active: true },
    { id: 'inst-veltech', institution_name: 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute', institution_code: '1-10901236', institution_type: 'UNIVERSITY', state_id: 23, district_id: 2301, is_active: true },
  ],
  // Database district 40 (Thiruvallur) & 720 (Tiruvallur)
  '23-40': [
    { id: 'inst-rmkec', institution_name: 'R.M.K. Engineering College (RMKEC)', institution_code: '1-10901234', institution_type: 'ENGINEERING', state_id: 23, district_id: 40, is_active: true },
    { id: 'inst-rmd', institution_name: 'R.M.D. Engineering College', institution_code: '1-10901235', institution_type: 'ENGINEERING', state_id: 23, district_id: 40, is_active: true },
    { id: 'inst-veltech', institution_name: 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute', institution_code: '1-10901236', institution_type: 'UNIVERSITY', state_id: 23, district_id: 40, is_active: true },
  ],
  '23-720': [
    { id: 'inst-rmkec', institution_name: 'R.M.K. Engineering College (RMKEC)', institution_code: '1-10901234', institution_type: 'ENGINEERING', state_id: 23, district_id: 720, is_active: true },
    { id: 'inst-rmd', institution_name: 'R.M.D. Engineering College', institution_code: '1-10901235', institution_type: 'ENGINEERING', state_id: 23, district_id: 720, is_active: true },
    { id: 'inst-veltech', institution_name: 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute', institution_code: '1-10901236', institution_type: 'UNIVERSITY', state_id: 23, district_id: 720, is_active: true },
  ],
  '23-17': [
    { id: 'inst-anna-ceg', institution_name: 'College of Engineering, Guindy (Anna University)', institution_code: '1-4067182501', institution_type: 'UNIVERSITY', state_id: 23, district_id: 17, is_active: true },
    { id: 'inst-iitm', institution_name: 'IIT Madras (Indian Institute of Technology)', institution_code: '1-4067182510', institution_type: 'UNIVERSITY', state_id: 23, district_id: 17, is_active: true },
    { id: 'inst-ssn', institution_name: 'SSN College of Engineering', institution_code: '1-4067182511', institution_type: 'ENGINEERING', state_id: 23, district_id: 17, is_active: true },
    { id: 'inst-mit', institution_name: 'Madras Institute of Technology (MIT Campus)', institution_code: '1-4067182512', institution_type: 'ENGINEERING', state_id: 23, district_id: 17, is_active: true },
  ],
  '23-2302': [
    { id: 'inst-anna-ceg', institution_name: 'College of Engineering, Guindy (Anna University)', institution_code: '1-4067182501', institution_type: 'UNIVERSITY', state_id: 23, district_id: 2302, is_active: true },
    { id: 'inst-iitm', institution_name: 'IIT Madras (Indian Institute of Technology)', institution_code: '1-4067182510', institution_type: 'UNIVERSITY', state_id: 23, district_id: 2302, is_active: true },
    { id: 'inst-ssn', institution_name: 'SSN College of Engineering', institution_code: '1-4067182511', institution_type: 'ENGINEERING', state_id: 23, district_id: 2302, is_active: true },
    { id: 'inst-mit', institution_name: 'Madras Institute of Technology (MIT Campus)', institution_code: '1-4067182512', institution_type: 'ENGINEERING', state_id: 23, district_id: 2302, is_active: true },
  ],
  '23-2303': [
    { id: 'inst-psg', institution_name: 'PSG College of Technology', institution_code: '1-4067182502', institution_type: 'ENGINEERING', state_id: 23, district_id: 2303, is_active: true },
  ],
  '14-1401': [
    { id: 'inst-coep', institution_name: 'College of Engineering Pune (COEP)', institution_code: '1-2049182301', institution_type: 'ENGINEERING', state_id: 14, district_id: 1401, is_active: true },
  ],
  '14-1402': [
    { id: 'inst-vjti', institution_name: 'Veermata Jijabai Technological Institute (VJTI)', institution_code: '1-2049182302', institution_type: 'ENGINEERING', state_id: 14, district_id: 1402, is_active: true },
  ],
  '11-1101': [
    { id: 'inst-rvce', institution_name: 'R.V. College of Engineering', institution_code: '1-3058192401', institution_type: 'ENGINEERING', state_id: 11, district_id: 1101, is_active: true },
    { id: 'inst-bmsce', institution_name: 'BMS College of Engineering', institution_code: '1-3058192402', institution_type: 'ENGINEERING', state_id: 11, district_id: 1101, is_active: true },
  ],
  '32-3203': [
    { id: 'inst-dtu', institution_name: 'Delhi Technological University (DTU)', institution_code: '1-5076192601', institution_type: 'UNIVERSITY', state_id: 32, district_id: 3203, is_active: true },
  ],
  '19-1901': [
    { id: 'inst-bit', institution_name: 'Bhubaneswar Institute of Technology', institution_code: '1-1099238411', institution_type: 'ENGINEERING', state_id: 19, district_id: 1901, is_active: true },
  ]
};
