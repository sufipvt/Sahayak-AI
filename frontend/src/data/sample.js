// SAMPLE DATA ONLY — hardcoded for the visual prototype.
// Descriptions are short, general summaries. Always check the official source.

export const sampleProfile = {
  description:
    'I am a 20-year-old B.Tech student from Haryana, family income under 3 lakh, OBC',
  fields: [
    { label: 'Age', value: '20' },
    { label: 'State', value: 'Haryana' },
    { label: 'Occupation', value: 'Student' },
    { label: 'Family income', value: '< ₹3 lakh' },
    { label: 'Category', value: 'OBC' },
  ],
}

export const exampleChips = [
  { label: 'Student', text: 'I am a 20-year-old B.Tech student from Haryana, family income under 3 lakh, OBC' },
  { label: 'Farmer', text: 'I am a small farmer in Punjab with 2 acres of land' },
  { label: 'Senior citizen', text: 'I am 67 years old, retired, living in Delhi with my wife' },
  { label: 'Woman entrepreneur', text: 'I am a woman who wants to start a tailoring business in Jaipur' },
]

export const howItWorks = [
  { title: 'Describe yourself', text: 'Type or speak in simple words, in your own language.' },
  { title: 'We build your profile', text: 'Age, state, income, category and occupation are picked out for you to check.' },
  { title: 'We match schemes', text: 'Only schemes whose eligibility rules fit your profile are shown.' },
  { title: 'Apply with confidence', text: 'See documents, steps, official links and the nearest help centre.' },
]

export const schemes = [
  {
    id: 'nsp-scholarship',
    name: 'National Scholarship Portal – Post-Matric Scholarships',
    short: 'NSP Scholarships',
    ministry: 'Ministry of Education / Ministry of Social Justice & Empowerment',
    category: 'Education',
    status: 'Eligible',
    why: 'You are an OBC student in higher education with family income under ₹3 lakh.',
    updated: '14 Oct 2026',
    citations: [1, 2],
    summary:
      'A single online portal for central and state scholarships for students from eligible categories and income groups.',
    benefits: [
      'Financial help towards tuition and maintenance for post-matric studies',
      'Amount is credited directly to the student’s bank account (DBT)',
      'One application on one portal for several schemes',
    ],
    eligibility: [
      'Student enrolled in a recognised post-matric / higher education course',
      'Belongs to an eligible category for the specific scholarship (e.g. SC / ST / OBC / Minority)',
      'Family income within the limit set for that scholarship',
    ],
    documents: ['Aadhaar card', 'Income certificate', 'Caste / category certificate', 'Previous year mark sheet', 'Fee receipt', 'Bank account details'],
    steps: [
      'Register on the National Scholarship Portal with your mobile number',
      'Fill in the application form and choose the applicable scholarship',
      'Upload the required documents',
      'Submit and get it verified by your institute',
      'Track status; the amount is credited to your bank account',
    ],
    source: 'https://scholarships.gov.in',
  },
  {
    id: 'pmkvy',
    name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
    short: 'PMKVY',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    category: 'Skills',
    status: 'Likely eligible',
    why: 'You are a young Indian citizen aged 15–45 looking to build job skills.',
    updated: '09 Oct 2026',
    citations: [3],
    summary: 'Free short-term skill training and certification to help young people get jobs.',
    benefits: ['Free short-term skill training at approved centres', 'Government-recognised certificate', 'Placement support after training'],
    eligibility: ['Indian citizen', 'Generally aged 15–45 years', 'School / college dropout or unemployed youth, or anyone wanting to upskill'],
    documents: ['Aadhaar card', 'Bank account details', 'Educational certificates', 'Passport-size photo'],
    steps: ['Find a nearby training centre on the Skill India portal', 'Choose a job role / course', 'Enrol with your documents', 'Complete training and assessment', 'Receive your certificate'],
    source: 'https://www.pmkvyofficial.org',
  },
  {
    id: 'pm-jay',
    name: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    short: 'Ayushman Bharat PM-JAY',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Health',
    status: 'Needs confirmation',
    why: 'Your family income is low, but eligibility depends on the SECC / state beneficiary list.',
    updated: '02 Oct 2026',
    citations: [4, 5],
    summary: 'Health cover for hospital treatment for eligible poor and vulnerable families.',
    benefits: ['Health cover of up to ₹5 lakh per family per year for hospital care', 'Cashless treatment at empanelled hospitals', 'Covers pre- and post-hospitalisation expenses'],
    eligibility: ['Family listed in the SECC database or state beneficiary list', 'Certain other groups as notified by the government'],
    documents: ['Aadhaar card', 'Ration card', 'Mobile number'],
    steps: ['Check eligibility on the PM-JAY portal or at a CSC', 'Complete e-KYC with Aadhaar', 'Get your Ayushman card', 'Show it at any empanelled hospital'],
    source: 'https://pmjay.gov.in',
  },
  {
    id: 'atal-pension',
    name: 'Atal Pension Yojana (APY)',
    short: 'Atal Pension Yojana',
    ministry: 'Ministry of Finance (PFRDA)',
    category: 'Pension',
    status: 'Eligible',
    why: 'You are between 18 and 40 years old and can open a savings account.',
    updated: '28 Sep 2026',
    citations: [6],
    summary: 'A pension scheme where you save small amounts now and get a fixed monthly pension after 60.',
    benefits: ['Guaranteed monthly pension of ₹1,000 – ₹5,000 after age 60', 'Pension continues to spouse after the subscriber', 'Small monthly contribution based on age'],
    eligibility: ['Indian citizen aged 18–40 years', 'Has a savings bank / post office account', 'Not an income-tax payer (as per current rules)'],
    documents: ['Aadhaar card', 'Savings bank account', 'Mobile number'],
    steps: ['Visit your bank or post office', 'Fill the APY registration form', 'Choose your pension amount', 'Allow auto-debit of the monthly contribution'],
    source: 'https://www.npscra.nsdl.co.in',
  },
  {
    id: 'pm-mudra',
    name: 'Pradhan Mantri Mudra Yojana (PMMY)',
    short: 'PM Mudra Yojana',
    ministry: 'Ministry of Finance',
    category: 'Business loan',
    status: 'Needs confirmation',
    why: 'Useful if you plan to start a small business; needs a business plan to confirm.',
    updated: '21 Sep 2026',
    citations: [7],
    summary: 'Collateral-free loans for small and micro businesses through banks and NBFCs.',
    benefits: ['Loans without collateral for non-farm small businesses', 'Shishu, Kishor and Tarun loan categories by size', 'Available through banks, NBFCs and MFIs'],
    eligibility: ['Indian citizen with a business plan for a non-farm income activity', 'Small / micro enterprise in manufacturing, trading or services'],
    documents: ['Aadhaar & PAN', 'Business plan / quotation', 'Address proof', 'Bank statements', 'Category certificate (if applicable)'],
    steps: ['Prepare a simple business plan', 'Apply at a bank / NBFC or on the Udyamimitra portal', 'Submit documents', 'Loan is sanctioned after bank appraisal'],
    source: 'https://www.mudra.org.in',
  },
  {
    id: 'pm-kisan',
    name: 'PM Kisan Samman Nidhi (PM-KISAN)',
    short: 'PM-KISAN',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture',
    status: 'Eligible',
    why: 'You are a landholding farmer family.',
    updated: '11 Oct 2026',
    citations: [8],
    summary: 'Income support paid directly to eligible landholding farmer families.',
    benefits: ['₹6,000 per year in three equal instalments', 'Paid directly to the bank account (DBT)'],
    eligibility: ['Landholding farmer family', 'Certain higher-income groups are excluded'],
    documents: ['Aadhaar card', 'Land records', 'Bank account details'],
    steps: ['Register on the PM-KISAN portal or at a CSC', 'Complete e-KYC', 'Get verified by the state', 'Receive instalments'],
    source: 'https://pmkisan.gov.in',
  },
  {
    id: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    short: 'PM Fasal Bima Yojana',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Insurance',
    status: 'Likely eligible',
    why: 'You grow notified crops in a notified area.',
    updated: '05 Oct 2026',
    citations: [9],
    summary: 'Crop insurance at a low premium against losses from natural calamities, pests and disease.',
    benefits: ['Low farmer premium for crop insurance', 'Covers losses from natural calamities, pests and diseases'],
    eligibility: ['Farmers growing notified crops in notified areas', 'Includes sharecroppers and tenant farmers'],
    documents: ['Aadhaar card', 'Land records / sowing certificate', 'Bank account details'],
    steps: ['Apply through bank, CSC or the PMFBY portal before the cut-off date', 'Pay the premium', 'Report crop loss within the given time'],
    source: 'https://pmfby.gov.in',
  },
  {
    id: 'pmay',
    name: 'Pradhan Mantri Awas Yojana (PMAY)',
    short: 'PM Awas Yojana',
    ministry: 'Ministry of Housing & Urban Affairs / Ministry of Rural Development',
    category: 'Housing',
    status: 'Needs confirmation',
    why: 'Your household may qualify if it does not own a pucca house.',
    updated: '30 Sep 2026',
    citations: [10],
    summary: 'Help for eligible families to build or buy a pucca house in urban and rural areas.',
    benefits: ['Financial assistance / interest subsidy for a pucca house', 'Separate components for urban and rural areas'],
    eligibility: ['Family does not own a pucca house anywhere in India', 'Falls in the notified income group (EWS / LIG etc.)'],
    documents: ['Aadhaar card', 'Income certificate', 'Property / land documents', 'Bank account details'],
    steps: ['Apply on the PMAY portal or through your urban / rural local body', 'Submit documents for verification', 'Assistance released in stages'],
    source: 'https://pmaymis.gov.in',
  },
]

// The 5 schemes shown for the sample student profile
export const resultIds = ['nsp-scholarship', 'pmkvy', 'atal-pension', 'pm-jay', 'pm-mudra']

export const sources = [
  { n: 1, title: 'NSP – Scheme guidelines', section: 'Eligibility' },
  { n: 2, title: 'Post-Matric Scholarship for OBC – Guidelines', section: 'Income ceiling' },
  { n: 3, title: 'PMKVY 4.0 – Guidelines', section: 'Target group' },
  { n: 4, title: 'PM-JAY – About the scheme', section: 'Benefit cover' },
  { n: 5, title: 'PM-JAY – Beneficiary identification', section: 'SECC criteria' },
  { n: 6, title: 'APY – Scheme details', section: 'Eligibility' },
  { n: 7, title: 'PMMY – Offerings', section: 'Loan categories' },
  { n: 8, title: 'PM-KISAN – Operational guidelines', section: 'Exclusions' },
  { n: 9, title: 'PMFBY – Operational guidelines', section: 'Coverage' },
  { n: 10, title: 'PMAY – Guidelines', section: 'Beneficiary definition' },
]

export const followUps = [
  'What documents do I need for the scholarship?',
  'When is the last date to apply?',
  'Can I get PMKVY training while studying?',
  'Where is the nearest help centre?',
]

export const centres = [
  { name: 'CSC – Sector 14 Market', type: 'Common Services Centre', address: 'Shop 12, Sector 14 Market, Gurugram, Haryana 122001', distance: '1.2 km', phone: '+91 98XXX 10234', x: 38, y: 34 },
  { name: 'Atal Seva Kendra – Mini Secretariat', type: 'Atal Seva Kendra', address: 'Mini Secretariat, Civil Lines, Gurugram 122001', distance: '2.4 km', phone: '+91 124 XXX 2201', x: 62, y: 26 },
  { name: 'CSC – DLF Phase 3', type: 'Common Services Centre', address: 'U-Block Market, DLF Phase 3, Gurugram 122010', distance: '3.1 km', phone: '+91 97XXX 44821', x: 70, y: 62 },
  { name: 'CSC – Sohna Road', type: 'Common Services Centre', address: 'Near Subhash Chowk, Sohna Road, Gurugram 122018', distance: '4.6 km', phone: '+91 99XXX 87612', x: 30, y: 72 },
  { name: 'Post Office Aadhaar Centre – Sector 29', type: 'Aadhaar / Post Office', address: 'Head Post Office, Sector 29, Gurugram 122002', distance: '5.3 km', phone: '+91 124 XXX 5560', x: 84, y: 42 },
]

export const pastChats = [
  { title: 'Scholarships for OBC B.Tech student in Haryana', date: '22 Oct 2026', results: 5 },
  { title: 'Skill training courses near Gurugram', date: '18 Oct 2026', results: 3 },
  { title: 'Health insurance for my parents', date: '12 Oct 2026', results: 2 },
  { title: 'Loan to start a small mobile repair shop', date: '04 Oct 2026', results: 4 },
]

export const savedIds = ['nsp-scholarship', 'atal-pension', 'pmkvy']

export const adminStats = [
  { label: 'Users', value: '1,284', delta: '+8% this week' },
  { label: 'Queries', value: '5,912', delta: '+12% this week' },
  { label: 'Avg response time', value: '7.4 s', delta: 'Target ≤ 10 s' },
  { label: 'Rating', value: '4.4 / 5', delta: '86% thumbs up' },
]

export const refreshRun = {
  lastRun: 'Sunday, 19 Oct 2026 · 02:00 AM',
  added: 3,
  changed: 12,
  removed: 1,
  changes: [
    { scheme: 'Post-Matric Scholarship for OBC', field: 'Income ceiling', change: 'Wording updated in guidelines' },
    { scheme: 'PM-KISAN', field: 'Exclusions', change: 'New FAQ section added' },
    { scheme: 'PMKVY', field: 'Training centres', change: 'Centre list refreshed' },
    { scheme: 'PM Fasal Bima Yojana', field: 'Last date (Rabi)', change: 'Cut-off date revised' },
  ],
}

export const evaluation = [
  { metric: 'Recall@5', target: 0.8, display: '≥ 0.80', note: 'Correct scheme appears in top 5 results' },
  { metric: 'Eligibility accuracy', target: 0.85, display: '≥ 85%', note: 'Eligible / not-eligible label matches ground truth' },
  { metric: 'Faithfulness', target: 0.85, display: '≥ 0.85', note: 'Answer claims supported by cited text' },
  { metric: 'Response time', target: 0.67, display: '≤ 10 s', note: 'End-to-end, text query (scale: 15 s)' },
]

export const getScheme = (id) => schemes.find((s) => s.id === id) || schemes[0]
