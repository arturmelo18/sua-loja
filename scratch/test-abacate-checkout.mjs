import fetch from 'node-fetch'
import 'dotenv/config'

const key = process.env.ABACATEPAY_API_KEY
if (!key) {
  console.log("No API Key")
  process.exit(1)
}

async function run() {
  try {
    const res = await fetch('https://api.abacatepay.com/v2/checkouts', {
      headers: { Authorization: `Bearer ${key}` }
    })
    console.log("Checkouts:", await res.text())
  } catch (e) {
    console.error("Error:", e)
  }
}
run()
