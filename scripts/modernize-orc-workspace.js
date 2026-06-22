const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'app', 'page.tsx')
let c = fs.readFileSync(file, 'utf8')
const start = c.indexOf('<div className="orc-pro__workspace">')
const end = c.indexOf('{/* Modal para Enviar Email */}', start)
if (start < 0 || end < 0) {
  console.error('markers not found', start, end)
  process.exit(1)
}
let ws = c.slice(start, end)

const greenPanel =
  /          <div style=\{\{ \n            marginBottom: '30px', \n            padding: '20px', \n            backgroundColor: '#141414', \n            borderRadius: '12px', \n            border: '1px solid rgba\(0, 200, 83, 0\.2\)'\n          \}\}>/g
const amberPanel =
  /          <div style=\{\{\n            marginBottom: '30px',\n            padding: '20px',\n            backgroundColor: '#141414',\n            borderRadius: '12px',\n            border: '1px solid rgba\(255, 165, 0, 0\.35\)'\n          \}\}>/g
const bluePanel =
  /          <div style=\{\{ \n            marginBottom: '30px', \n            padding: '20px', \n            backgroundColor: '#141414', \n            borderRadius: '12px', \n            border: '1px solid rgba\(0, 100, 255, 0\.2\)'\n          \}\}>/g

const n1 = (ws.match(greenPanel) || []).length
const n2 = (ws.match(amberPanel) || []).length
const n3 = (ws.match(bluePanel) || []).length

ws = ws.replace(greenPanel, '          <div className="orc-pro__panel">')
ws = ws.replace(amberPanel, '          <div className="orc-pro__panel orc-pro__panel--amber">')
ws = ws.replace(bluePanel, '          <div className="orc-pro__panel orc-pro__panel--blue">')
ws = ws.replace(
  /            <h3 style=\{\{ color: '#00c853', marginBottom: '15px', fontSize: '18px' \}\}>/g,
  '            <h3 className="orc-pro__panel-title">'
)
ws = ws.replace(
  /            <h3 style=\{\{ color: '#66b3ff', marginBottom: '15px', fontSize: '18px' \}\}>/g,
  '            <h3 className="orc-pro__panel-title orc-pro__panel-title--blue">'
)
ws = ws.replace(
  /            <h3 style=\{\{ color: '#ffa500', marginBottom: '8px', fontSize: '18px' \}\}>/g,
  '            <h3 className="orc-pro__panel-title orc-pro__panel-title--amber">'
)
ws = ws.replace(
  /              style=\{\{\n                width: '100%',\n                padding: '12px',\n                marginBottom: '15px',\n                backgroundColor: '#1e1e1e',\n                border: '1px solid rgba\(0, 200, 83, 0\.3\)',\n                borderRadius: '6px',\n                color: '#fff',\n                fontSize: '14px'\n              \}\}/g,
  '              className="orc-pro__search"'
)
ws = ws.replace(
  /              style=\{\{\n                width: '100%',\n                padding: '12px',\n                marginBottom: '12px',\n                backgroundColor: '#1e1e1e',\n                border: '1px solid rgba\(255, 165, 0, 0\.35\)',\n                borderRadius: '6px',\n                color: '#fff',\n                fontSize: '14px'\n              \}\}/g,
  '              className="orc-pro__search orc-pro__search--amber"'
)
ws = ws.replace(
  /            <div style=\{\{ maxHeight: '300px', overflowY: 'auto' \}\}>/g,
  '            <div className="orc-pro__scroll-list">'
)
ws = ws.replace(
  /            <div style=\{\{ maxHeight: '240px', overflowY: 'auto', marginBottom: '12px' \}\}>/g,
  '            <div className="orc-pro__scroll-list orc-pro__scroll-list--sm">'
)
ws = ws.replace(
  /                <p style=\{\{ color: '#ccc', textAlign: 'center', padding: '20px' \}\}>/g,
  '                <p className="orc-pro__empty-hint">'
)
ws = ws.replace(
  /                <p style=\{\{ color: '#ccc', textAlign: 'center', padding: '16px' \}\}/g,
  '                <p className="orc-pro__empty-hint">'
)

c = c.slice(0, start) + ws + c.slice(end)
fs.writeFileSync(file, c)
console.log('Replaced panels — green:', n1, 'amber:', n2, 'blue:', n3)
