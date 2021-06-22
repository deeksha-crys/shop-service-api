const createPaymentIntent = require("./create-payment-intent");
const createCustomerWithSetUpIntent = require("./create-setup-intent");
const confirmOrder = require("./confirm-order");
const retrievePaymentMethod = require("./retrieve-payment-method");
const detachPaymentMethod = require("./detach-payment-method");
const attachPaymentMethod = require("./attach-payment-method");
const generateInvoiceAndChargePayment = require("./generate-invoice-and-charge");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

module.exports = {
  enabled: Boolean(STRIPE_SECRET_KEY && STRIPE_PUBLISHABLE_KEY),

  // The required frontend config
  frontendConfig: {
    publishableKey: STRIPE_PUBLISHABLE_KEY,
  },
  createPaymentIntent,
  confirmOrder,
  createCustomerWithSetUpIntent,
  retrievePaymentMethod,
  detachPaymentMethod,
  attachPaymentMethod,
  generateInvoiceAndChargePayment,
};
