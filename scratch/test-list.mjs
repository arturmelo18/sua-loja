import fetch from 'node-fetch'
import 'dotenv/config'
const key = process.env.ABACATEPAY_API_KEY
async function run() {
  const routes = ['/billing', '/billing/list', '/billings', '/checkouts', '/checkout', '/orders']
  for (const r of routes) {
    const res = await fetch('https://api.abacatepay.com/v1' + r, { headers: { Authorization: `Bearer ${key}` } })
    console.log("v1", r, res.status)
  }
  for (const r of routes) {
    const res = await fetch('https://api.abacatepay.com/v2' + r, { headers: { Authorization: `Bearer ${key}` } })
    console.log("v2", r, res.status)
  }
}
run()
