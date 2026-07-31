import crypto from "crypto";

export const ESEWA_CONFIG = {
    merchantId: "EPAYTEST",
    secretKey: "8gBm/:&EnhH.1/q",
    formUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    statusCheckUrl: "https://rc.esewa.com.np/api/epay/transaction/status/",
};

export const generateEsewaSignature = ({ total_amount, transaction_uuid, product_code }) => {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const hmac = crypto.createHmac("sha256", ESEWA_CONFIG.secretKey);
    hmac.update(message);
    return hmac.digest("base64");
};