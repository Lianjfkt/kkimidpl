const fs = require('fs');

const content = fs.readFileSync('/media/lian/Ubuntu/Dojo Managemen/src/lib/mockData.ts', 'utf8');

// Extract all fee block objects that contain "lunas" — grab full multi-line objects from initialFees section
const feesStart = content.indexOf('export const initialFees');
const feesEnd = content.indexOf('\nexport const ', feesStart + 10);
const feesSection = content.slice(feesStart, feesEnd);

// Extract student names from initialStudents
const studentsStart = content.indexOf('export const initialStudents');
const studentsEnd = content.indexOf('\nexport const ', studentsStart + 10);
const studentsSection = content.slice(studentsStart, studentsEnd);

const studentMap = {};
const studentIdMatches = [...studentsSection.matchAll(/"id":\s*"([^"]+)"[^}]*?"full_name":\s*"([^"]+)"/gs)];
studentIdMatches.forEach(m => { studentMap[m[1]] = m[2]; });

// Parse fee blocks using a stateful object extractor
const feeBlocks = [];
let depth = 0;
let start = -1;
for (let i = 0; i < feesSection.length; i++) {
  if (feesSection[i] === '{') {
    if (depth === 0) start = i;
    depth++;
  } else if (feesSection[i] === '}') {
    depth--;
    if (depth === 0 && start !== -1) {
      const block = feesSection.slice(start, i + 1);
      try {
        const obj = JSON.parse(block.replace(/\/\/[^\n]*/g, ''));
        feeBlocks.push(obj);
      } catch(e) {}
      start = -1;
    }
  }
}

const lunasFees = feeBlocks.filter(f => f.status === 'lunas');
console.log(`Found ${feeBlocks.length} total fees, ${lunasFees.length} lunas`);

// Build transactions
const financeTransactions = [
  {
    id: 'tx-rent',
    type: 'pengeluaran',
    category: 'sewa',
    amount: 500000,
    transaction_date: '2026-05-01',
    description: 'Sewa Aula Latihan Bulanan',
    created_by: 'user-owner-id'
  }
];

lunasFees.forEach(fee => {
  const name = studentMap[fee.student_id] || 'Siswa';
  const paidDate = fee.paid_date || `${fee.period_year}-${String(fee.period_month).padStart(2,'0')}-10`;
  financeTransactions.push({
    id: `tx-${fee.id}`,
    type: 'pemasukan',
    category: 'iuran',
    amount: fee.amount,
    transaction_date: paidDate,
    description: `Iuran Bulan ${fee.period_month}/${fee.period_year} - ${name}`,
    created_by: 'user-owner-id'
  });
});

// Replace initialFinanceTransactions block in mockData.ts
const marker = 'export const initialFinanceTransactions: FinanceTransaction[] =';
const blockStart = content.indexOf(marker);

if (blockStart === -1) {
  console.error('Cannot find initialFinanceTransactions');
  process.exit(1);
}

// Find the end of the array — look for ];\n
let arrStart = content.indexOf('[', blockStart);
let d = 0;
let arrEnd = -1;
for (let i = arrStart; i < content.length; i++) {
  if (content[i] === '[') d++;
  else if (content[i] === ']') {
    d--;
    if (d === 0) { arrEnd = i; break; }
  }
}

if (arrEnd === -1) {
  console.error('Cannot find end of initialFinanceTransactions array');
  process.exit(1);
}

const newBlock = `${marker} ${JSON.stringify(financeTransactions, null, 2)}`;
const newContent = content.slice(0, blockStart) + newBlock + content.slice(arrEnd + 1);

fs.writeFileSync('/media/lian/Ubuntu/Dojo Managemen/src/lib/mockData.ts', newContent, 'utf8');
console.log(`Done! Generated ${financeTransactions.length - 1} pemasukan transactions from lunas fees.`);
console.log(`Total transactions: ${financeTransactions.length}`);
