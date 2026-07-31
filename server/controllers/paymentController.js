import crypto from "crypto";
import axios from "axios";
import Booking from "../models/Booking.js";
import { ESEWA_CONFIG, generateEsewaSignature } from "../configs/esewa.js";

// API to initiate an eSewa payment
// POST /api/payments/esewa/initiate
export const initiateEsewaPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.user !== req.user._id) {
      return res.json({ success: false, message: "Not authorized" });
    }

    const transactionUuid = `${bookingId}-${Date.now()}`;
    booking.transactionUuid = transactionUuid;
    await booking.save();

    const total_amount = booking.totalPrice;

    const signature = generateEsewaSignature({
      total_amount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_CONFIG.merchantId,
    });

    const paymentData = {
      amount: total_amount,
      tax_amount: 0,
      total_amount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_CONFIG.merchantId,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${process.env.BACKEND_URL}/api/payments/esewa/success`,
      failure_url: `${process.env.BACKEND_URL}/api/payments/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    res.json({ success: true, paymentData, formUrl: ESEWA_CONFIG.formUrl });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/payments/esewa/success
export const esewaSuccess = async (req, res) => {
  try {
    const encodedData = req.query.data;
    const decodedData = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));

    const { transaction_uuid, total_amount } = decodedData;

    // Verify with eSewa's official status check API
    const verifyResponse = await axios.get(ESEWA_CONFIG.statusCheckUrl, {
      params: {
        product_code: ESEWA_CONFIG.merchantId,
        total_amount,
        transaction_uuid,
      },
    });

    if (verifyResponse.data.status === "COMPLETE") {
      const booking = await Booking.findOne({ transactionUuid: transaction_uuid });
      if (booking) {
        booking.isPaid = true;
        booking.paymentMethod = "eSewa";
        await booking.save();
      }
      return res.redirect(`${process.env.FRONTEND_URL}/payment-success`);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
  } catch (error) {
    console.log(error);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
  }
};

// GET /api/payments/esewa/failure
export const esewaFailure = async (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
};