const STRIPE_ZERO_TAX_RATE_ID = process.env.STRIPE_ZERO_TAX_RATE_ID;

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
  const stripeCustomer = await getClient().customers.retrieve(customerId);
  const paymentMethodId =
    paymentMethods?.data.length > 0 ? paymentMethods?.data[0]["id"] : null;
  const crystallizeTenantId = stripeCustomer?.metadata?.customerTenantId;

  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount_decimal: usage.orders.unit_amount,
    quantity: usage.orders.quantity,
    description: "Orders over plan limit of 1000",
    currency: "usd",
  });
  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount_decimal: usage.items.unit_amount,
    quantity: usage.items.quantity,
    description: "Catalogue items over plan limit of 100,000",
    currency: "usd",
  });
  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount_decimal: usage.bandwidth.unit_amount,
    quantity: usage.bandwidth.quantity,
    description: "Bandwidth over plan limit of 50GB",
    currency: "usd",
  });
  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount_decimal: usage.apiCalls.unit_amount,
    quantity: usage.apiCalls.quantity,
    description: "Api Calls over plan limit of 500,000",
    currency: "usd",
  });
  await getClient().invoiceItems.create({
    customer: customerId,
    unit_amount_decimal: usage.plan.unit_amount,
    quantity: usage.plan.quantity,
    description: "Atom plan base fee",
    currency: "usd",
  });

  if (paymentMethodId) {
    const invoice = await getClient().invoices.create({
      customer: customerId,
      default_tax_rates: [taxRateId],
      metadata: { customerTenantId: crystallizeTenantId },
    });
    const finalizedInvoice = await getClient().invoices.finalizeInvoice(
      invoice.id,
      { auto_advance: true }
    );
    return await getClient().invoices.pay(finalizedInvoice.id, {
      payment_method: paymentMethodId,
    });
  } else {
    const invoice = await getClient().invoices.create({
      customer: customerId,
      default_tax_rates: [taxRateId],
      metadata: { customerTenantId: crystallizeTenantId },
      collection_method: "send_invoice",
      days_until_due: 10,
    });
    return await getClient().invoices.finalizeInvoice(invoice.id, {
      auto_advance: true,
    });
  }
};
