import fetch from 'node-fetch'
import 'dotenv/config'

const key = process.env.ABACATEPAY_API_KEY

async function run() {
  const id = 'bill_GXXWS4EKqEKAhzsaTjcZrYUX'
  let res = await fetch('https://api.abacatepay.com/v2/billing/' + id, {
    headers: { Authorization: `Bearer ${key}` }
  })
  console.log("billing:", await res.text())

  res = await fetch('https://api.abacatepay.com/v2/billings/' + id, {
    headers: { Authorization: `Bearer ${key}` }
  })
  console.log("billings:", await res.text())
}
run()
