import mongoose from 'mongoose'
import 'dotenv/config'

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const pendingOrders = await db.collection('orders').find({ status: 'PENDING' }).toArray()
  console.log("Pending orders count:", pendingOrders.length)
  if (pendingOrders.length > 0) {
    console.log("Sample pending order externalId:", pendingOrders[0].externalId)
    console.log("Sample pending order abacatePayCheckoutId:", pendingOrders[0].abacatePayCheckoutId)
  }
  process.exit(0)
}
run()
