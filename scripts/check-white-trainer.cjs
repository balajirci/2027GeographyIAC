// Run: node scripts/check-white-trainer.cjs
// Zero-dependency integrity and JavaScript syntax checks for the offline trainer.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('white-trainer.html','utf8');
const match=html.match(/<script id="bank" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(match,'Embedded question bank is missing');
const bank=JSON.parse(match[1]);
assert.equal(bank.length,900,'Bank should contain 900 questions');
assert.equal(new Set(bank.map(q=>q.id)).size,bank.length,'Duplicate question IDs');
assert.equal(new Set(bank.map(q=>String(q.q).toLowerCase().replace(/\s+/g,' ').trim())).size,bank.length,'Duplicate question text');
assert.equal(new Set(bank.map(q=>q.round)).size,30,'Expected 30 source rounds');
for(let i=1;i<=30;i++){
  assert.equal(bank.filter(q=>q.round==='Round '+i).length,30,'Incorrect size of Round '+i);
}
bank.forEach(q=>{
  assert.ok(q.id&&q.q&&q.a&&q.topic&&q.round,'Incomplete question record '+q.id);
  assert.ok(!/\b(?:accept|do not|before|anti-prompt|prompt on|or equivalent)\s*$/i.test(q.a),'Truncated answer key '+q.id);
});
const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.equal(blocks.length,2,'Expected embedded bank and one trainer script');
new vm.Script(blocks[1][1],{filename:'white-trainer-inline.js'});
[
  'id="responseText"','id="lockAnswer"','id="oralAnswer"','id="continueRound"',
  'id="dashboard"','id="exportCSV"','id="exportJSON"','id="importJSON"',
  "if(result==='correct'&&!responseLocked)return",
  "if(!current||graded)return",
  'function selectMockQuestions(allowSeen)',
  'function renderDashboard()',
  'function exportCSV()'
].forEach(s=>assert.ok(html.includes(s),'Expected safeguard missing: '+s));
console.log('PASS: 900 unique questions, 30 rounds x 30, all answer keys populated, inline JS syntax valid, upgrade features present.');