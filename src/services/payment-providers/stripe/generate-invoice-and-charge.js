module.exports = async function generateInvoiceAndChargePayment(
  customerId,
  taxRateId,
  usage
) {
  const { getClient } = require("./utils");
  const paymentMethods = await getClient().paymentMethods.list({
    customer: customerId,
    type: "card",
  });
  const paymentMethodId = paymentMethods.data[0]["id"];
  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount: usage.orders.unit_amount,
    quantity: usage.orders.quantity,
    description: "Extra Orders",
    currency: "usd",
  });
  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount: usage.items.unit_amount,
    quantity: usage.items.quantity,
    description: "Extra Items",
    currency: "usd",
  });

  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount: usage.bandwidth.unit_amount,
    quantity: usage.bandwidth.quantity,
    description: "Extra Bandwidth",
    currency: "usd",
  });

  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount: usage.apiCalls.unit_amount,
    quantity: usage.apiCalls.quantity,
    description: "Extra Api Calls",
    currency: "usd",
  });

  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount: 1,
    quantity: 0,
    description: "Flat fee",
    currency: "usd",
  });

  const invoice = await getClient().invoices.create({
    customer: customerId,
    default_tax_rates: [taxRateId],
  });
  const finalizedInvoice = await getClient().invoices.finalizeInvoice(
    invoice.id,
    { auto_advance: true }
  );
  return await getClient().invoices.pay(finalizedInvoice.id, {
    payment_method: paymentMethodId,
  });
};
