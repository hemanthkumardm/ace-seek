import crypto from "crypto";

const keySecret = "23nSIW3Zbai6KCdAgO6E0S0P";
const orderId = "order_test_123456";
const paymentId = "pay_test_789012";

const payload = `${orderId}|${paymentId}`;
const generatedSig = crypto
  .createHmac("sha256", keySecret)
  .update(payload)
  .digest("hex");

console.log("=== RAZORPAY HMAC SIGNATURE TEST ===");
console.log("Order ID:", orderId);
console.log("Payment ID:", paymentId);
console.log("Generated Signature:", generatedSig);

const match = crypto.timingSafeEqual(
  Buffer.from(generatedSig, "utf-8"),
  Buffer.from(generatedSig, "utf-8")
);
console.log("Signature Verification Match:", match);
