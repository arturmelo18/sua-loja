import mongoose from 'mongoose'
import 'dotenv/config'
import fetch from 'node-fetch'

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const order = await db.collection('orders').findOne({ abacatePayCheckoutId: { $exists: true } })
  console.log("Order checkout ID:", order?.abacatePayCheckoutId)
  
  if (order?.abacatePayCheckoutId) {
    const res = await fetch('https://api.abacatepay.com/v2/checkouts/' + order.abacatePayCheckoutId, {
      headers: { Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}` }
    })
    console.log("Checkout data:", await res.text())
  }
  process.exit(0)
}
run()
