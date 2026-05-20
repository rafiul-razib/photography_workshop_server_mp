const express = require("express");
const QRCode = require("qrcode");
const SSLCommerzPayment = require("sslcommerz-lts");
const cors = require("cors");
const app = express();
require("dotenv").config();

const chatService = require("./services/chatService");
const { extractUserQuery, normalizeSessionId } = require("./utils/chatMessageUtils");
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3000"],
  }),
);
app.use(express.json());

const port = process.env.PORT || 5000;

// MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { sendConfirmationEmail } = require("./emailService");

const uri = process.env.URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false; //true for live, false for sandbox

async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    // console.log("Connected to MongoDB!");

    const database = client.db("photographyWorkshopDB");
    const allMembersCollection = database.collection("allMembers");

    // ---------------------------
    //         ROUTES
    // ---------------------------

    // Fetch all registered members
    app.get("/allRegisteredMembers", async (req, res) => {
      try {
        const result = await allMembersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Error fetching members" });
      }
    });

    app.post("/chat", async (req, res) => {
      try {
        const query = extractUserQuery(req.body);
        const sessionId = normalizeSessionId(req.body?.sessionId);

        if (!query) {
          return res.status(400).json({ error: "Message is required" });
        }

        const result = await chatService.getSessionReply(sessionId, query);
        return res.json(result);
      } catch (error) {
        console.error("Chat error →", error);
        return res.status(500).json({
          reply:
            "Our event assistant is currently unavailable. Please visit the help desk near the main entrance.",
        });
      }
    });

    app.post("/register", async (req, res) => {
      try {
        const tran_id = new ObjectId().toString();
        const payload = req.body;
        const amount = 1250;

        const data = {
          total_amount: amount,
          currency: "BDT",
          tran_id: tran_id,
          // server address here
          success_url: `http://localhost:5000/payment/success/${tran_id}`,
          fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
          cancel_url: "http://localhost:5000/cancel",
          ipn_url: "http://localhost:5000/ipn",
          // ...........
          shipping_method: "Courier",
          product_name: "Photography Workshop",
          product_category: "Registration",
          product_profile: "general",
          cus_name: payload.fullName,
          cus_email: payload.email,
          cus_add1: payload.address,
          cus_add2: "Dhaka",
          cus_city: "Dhaka",
          cus_state: "Dhaka",
          cus_postcode: "1000",
          cus_country: "Bangladesh",
          cus_phone: payload.phone,
          cus_fax: "01711111111",
          ship_name: "Customer Name",
          ship_add1: "Dhaka",
          ship_add2: "Dhaka",
          ship_city: "Dhaka",
          ship_state: "Dhaka",
          ship_postcode: 1000,
          ship_country: "Bangladesh",
        };

        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

        const apiResponse = await sslcz.init(data);
        const GatewayPageURL = apiResponse.GatewayPageURL;

        const finalOrder = {
          ...payload,
          totalAmount: amount,
          paymentStatus: false,
          transactionId: tran_id,
        };

        // INSERT BEFORE SENDING RESPONSE
        const result = await allMembersCollection.insertOne(finalOrder);
        console.log("Inserted →", result.insertedId);

        // NOW send response
        return res.send({ url: GatewayPageURL });
      } catch (error) {
        console.error("Register error →", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/payment/success/:tran_id", async (req, res) => {
      // console.log("Transaction Id: ", req.params.tran_id);

      const result = await allMembersCollection.updateOne(
        { transactionId: req.params.tran_id },
        {
          $set: {
            paymentStatus: true,
          },
        },
      );

      // After you get tran_id

      const verifyURL = `http://localhost:3000/verifyUser/${req.params.tran_id}`;
      const qrImageURL = await QRCode.toDataURL(verifyURL);

      if (result.modifiedCount > 0) {
        // Get user data to send email
        const user = await allMembersCollection.findOne({
          transactionId: req.params.tran_id,
        });

        // Send confirmation email
        await sendConfirmationEmail(
          user.email,
          user.fullName,
          req.params.tran_id,
          qrImageURL,
        );

        // Redirect

        res.redirect(
          `http://localhost:3000/paymentConfirmation/success/${req.params.tran_id}`,
        );
      }
    });

    app.all("/payment/fail/:tran_id", async (req, res) => {
      try {
        // const tranId = req.params.tran_id;

        console.log("Trying to delete transactionId:", req.params.tran_id);

        const result = await allMembersCollection.deleteOne({
          transactionId: req.params.tran_id,
        });
        console.log(result);

        if (result.deletedCount) {
          return res.redirect(
            `http://localhost:3000/paymentConfirmation/fail/${req.params.tran_id}`,
          );
        }

        return res.status(404).json({ message: "Transaction not found." });
      } catch (error) {
        console.error("Payment fail route error →", error);
        return res.status(500).json({ message: "Internal server error." });
      }
    });

    app.get("/verifyUser/:transactionId", async (req, res) => {
      const transId = req.params.transactionId;
      const result = await allMembersCollection.findOne({
        transactionId: transId,
      });
      res.send(result);
    });
  } finally {
    // keeping the connection open for server lifetime
  }
}

run().catch(console.dir);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Reunion Server is Running!!");
});

// Run server
app.listen(port, () => {
  console.log(`Workshop running on port: ${port}`);
});
