const { paymentStatus, planInfo } = require("../crystallize/utils");

const meteredVariableIdToName = {
  items: "611ebbe7fd767e0008d72025",
  orders: "611ebbe7fd767e0008d72026",
  apiCalls: "611ebbe7fd767e0008d72027",
  bandwidth: "611ebbe7fd767e0008d72028",
};
module.exports = async function sendOrderConfirmation(orderId, email, status) {
  let message;
  if (status === paymentStatus.PAYMENT_METHOD_MISSING)
    message =
      "Your credit card is missing. Paying on time is easy - sign-up for pre-authorized payments. It's easy to do. Simply add credit card within your Crystallize account and automatic payments will be set up for you. Here are your order details at a glance.";
  else if (status === paymentStatus.PAYMENT_FAILURE)
    message =
      "We could not collect the payment from your card. Please add a new payment method by logging into your Crystallize account. Here are your order details at a glance.";
  else if (status === paymentStatus.PAYMENT_SUCCESS)
    message =
      "You recently made a payment towards your Crystallize subscription!. Here are your order details at a glance.";
  else message = "Here are your order details at a glance.";

  try {
    const mjml2html = require("mjml");

    const { formatCurrency } = require("../../lib/currency");
    const { orders } = require("../crystallize");
    const { sendEmail } = require("./utils");
    const order = await orders.get(orderId);
    const itemsMeter = order.cart[0].subscription.meteredVariables.filter(
      (m) => m.id === meteredVariableIdToName.items
    )[0];
    const ordersMeter = order.cart[0].subscription.meteredVariables.filter(
      (m) => m.id === meteredVariableIdToName.orders
    )[0];
    const apiCallsMeter = order.cart[0].subscription.meteredVariables.filter(
      (m) => m.id === meteredVariableIdToName.apiCalls
    )[0];
    const bandwidthMeter = order.cart[0].subscription.meteredVariables.filter(
      (m) => m.id === meteredVariableIdToName.bandwidth
    )[0];

    if (!email) {
      return {
        success: false,
        error: "No email is connected with the customer object",
      };
    }
    const planName = order.cart[0].name.includes("particle")
      ? "Particle"
      : order.cart[0].name.includes("atom")
      ? "Atom"
      : "Crystal";
    const planLimits = planInfo[planName.toLowerCase()];

    const { html } = mjml2html(`
      <mjml>
        <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h1>Your Crystallize ${planName} subscription is renewed</h1>
              <p>${message}</p>
              <p>
                Order Number: <strong>#${order.id}</strong>
              </p>
              <p>
                Your Monthly plan: <strong>${planName}</strong><br/>
              </p>
              <p>
                Total due: <strong>${formatCurrency({
                  amount: order.total.gross,
                  currency: order.total.currency,
                })}</strong>
              </p>
            </mj-text>
            <mj-table>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <th style="padding: 0 15px 0 0;">Your plan</th>
                <th style="padding: 0 15px;">Usage</th>
                <th style="padding: 0 0 0 15px;">Cost</th>
              </tr>
              ${order.cart.map(
                (item) => `<tr>
                  <td style="padding: 0 15px 0 0;">${
                    item.name.includes("particle")
                      ? "Particle plan fee"
                      : item.name.includes("particle")
                      ? "Atom plan fee"
                      : "Crystal plan fee"
                  }</td>
                  <td style="padding: 0 15px;">${item.quantity}</td>
                  <td style="padding: 0 0 0 15px;">${formatCurrency({
                    amount: item.price.gross * item.quantity,
                    currency: item.price.currency,
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 0 15px 0 0">${planLimits.bandwidth}</td>
                  <td style="padding: 0 15px;">${bandwidthMeter.usage}GB</td>
                  <td style="padding: 0 0 0 15px;">$${bandwidthMeter.price}</td>
                </tr>
                
                <tr>
                  <td style="padding: 0 15px 0 0">${planLimits.orders}</td>
                  <td style="padding: 0 15px;">${ordersMeter.usage}</td>
                  <td style="padding: 0 0 0 15px;">$${ordersMeter.price}</td>
                </tr>
                
                <tr>
                  <td style="padding: 0 15px 0 0">${
                    planLimits.catalogueItems
                  }</td>
                  <td style="padding: 0 15px;">${itemsMeter.usage}</td>
                  <td style="padding: 0 0 0 15px;">$${itemsMeter.price}</td>
                </tr>
                
                <tr>
                  <td style="padding: 0 15px 0 0">${planLimits.apiCalls}</td>
                  <td style="padding: 0 15px;">${apiCallsMeter.usage}</td>
                  <td style="padding: 0 0 0 15px;">$${apiCallsMeter.price}</td>
                </tr>`
              )}
            </mj-table>
          </mj-column>
        </mj-section>
        <mj-section>
          <mj-column>
            <mj-text>
              <p>You can manage payments within your Crystallize account</p> <a href="https://pim.crystallize.com/signin">My bills & payments</a>
            </mj-text>
          </mj-column>
        </mj-section>
        </mj-body>
      </mjml>
    `);

    await sendEmail({
      to: email,
      subject: "Crystallize order summary",
      html,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error,
    };
  }
};
