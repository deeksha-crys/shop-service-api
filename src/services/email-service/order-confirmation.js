import getCustomer from "../crystallize/customers/get-customer";
import getTenantInfo from "../crystallize/tenants/get-tenant";
import getSubscriptionPlan from "../crystallize/subscriptions/get-subscription-plan";
const { paymentStatus, planPricing } = require("../crystallize/utils");

const CATALOGUE_ITEMS_METER_IDENTIFIER =
  process.env.CATALOGUE_ITEMS_METER_IDENTIFIER;
const ORDERS_METER_IDENTIFIER = process.env.ORDERS_METER_IDENTIFIER;
const API_CALLS_METER_IDENTIFIER = process.env.API_CALLS_METER_IDENTIFIER;
const BANDWIDTH_METER_IDENTIFIER = process.env.BANDWIDTH_METER_IDENTIFIER;

const getMeteredVariableInfo = (
  meterIdentifier,
  subscriptionPlan,
  orderMeteredVariables
) => {
  const meterInfoFromSubPlan = subscriptionPlan.meteredVariables.filter(
    (m) => m.identifier === meterIdentifier
  )[0];
  const meterInfoFromOrder = orderMeteredVariables.filter(
    (m) => m.id === meterInfoFromSubPlan.id
  )[0];
  return { ...meterInfoFromSubPlan, ...meterInfoFromOrder };
};
const getSubscriptionPeriod = () => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const subscriptionDate = new Date();
  subscriptionDate.setDate(1); // 1st of the month
  subscriptionDate.setHours(-1); //last hour before this date even started
  const monthName = monthNames[subscriptionDate.getMonth()];
  return `${monthName} 1 - ${subscriptionDate.getDate()}, ${subscriptionDate.getFullYear()}`;
};

module.exports = async function sendOrderConfirmation(orderId, email, status) {
  if (!email) {
    return {
      success: false,
      error: "No email is connected with the customer object",
    };
  }
  const subscriptionPlan = await getSubscriptionPlan();
  try {
    const mjml2html = require("mjml");
    const { formatCurrency } = require("../../lib/currency");
    const { orders } = require("../crystallize");
    const { sendEmail } = require("./utils");
    const order = await orders.get(orderId);
    const vatPercent = order.cart[0].price.tax.percent;
    const vatTitle = `VAT (${vatPercent}%)`;
    const vatAmount = order.cart[0].price.gross - order.cart[0].price.net;
    const createdAt = new Date(order.createdAt);
    const orderDate = `${createdAt.getDate()}.${
      createdAt.getMonth() + 1
    }.${createdAt.getFullYear()}`;
    const crystallizeCustomer = await getCustomer({
      identifier: order.customer.identifier,
    });
    const tenantInfo = await getTenantInfo(order.customer.identifier);
    const customerFullName = `${order.customer.firstName} ${order.customer.lastName}`;
    const billingAddress = crystallizeCustomer.addresses.filter(
      (addr) => addr?.type?.toLowerCase() === "billing"
    )[0];
    const planName = order.cart[0].name.includes("particle")
      ? "Particle"
      : order.cart[0].name.includes("atom")
      ? "Atom"
      : "Crystal";
    const planBasePrice = planPricing[planName.toLowerCase()].basePrice / 100;
    const planLimits = planPricing[planName.toLowerCase()];
    const itemsMeter = getMeteredVariableInfo(
      CATALOGUE_ITEMS_METER_IDENTIFIER,
      subscriptionPlan,
      order.cart[0].subscription.meteredVariables
    );
    const ordersMeter = getMeteredVariableInfo(
      ORDERS_METER_IDENTIFIER,
      subscriptionPlan,
      order.cart[0].subscription.meteredVariables
    );
    const apiCallsMeter = getMeteredVariableInfo(
      API_CALLS_METER_IDENTIFIER,
      subscriptionPlan,
      order.cart[0].subscription.meteredVariables
    );
    const bandwidthMeter = getMeteredVariableInfo(
      BANDWIDTH_METER_IDENTIFIER,
      subscriptionPlan,
      order.cart[0].subscription.meteredVariables
    );
    let message;
    if (status === paymentStatus.PAYMENT_METHOD_MISSING)
      message = "Your credit card is missing. New payment method required!";
    else if (status === paymentStatus.PAYMENT_FAILURE)
      message =
        "We could not collect the payment from your card. New payment method required!";
    else if (status === paymentStatus.PAYMENT_SUCCESS)
      message = ` Thank you for the payment!. Your ${planName} plan has been renewed.`;
    else message = `Your ${planName} plan has been renewed`;

    const { html } = mjml2html(`
     <mjml>
      <mj-head>
        <mj-font name="Roboto" href="http://fonts.googleapis.com/css?family=Roboto"></mj-font>
      </mj-head>
      <mj-body background-color="#fff">
        <mj-section padding="10px 0">
          <mj-column>
            <mj-image padding="10px 0" width="130px" src="https://crystallize.com/static/logo-crystallize.png" align="left"></mj-image>
          </mj-column>
        </mj-section>
        <mj-section padding="10px 0">
          <mj-column>
            <mj-text padding="30px 25px 5px 0" color="#4D525B" font-size="24px" align="left" line-height="140%" font-family="Roboto, Arial, sans-serif">
              <strong>${message}</strong></mj-text>
            <mj-text padding="0px 25px 30px 0" color="#4D525B" font-size="18px" align="left" line-height="140%" font-family="Roboto, Arial, sans-serif">
              This email contains a copy of your subscription order.
            </mj-text>
          </mj-column>
        </mj-section>
        <mj-section background-color="#F6F6F6" border-radius="12px" padding="15px 0px">
          <mj-column>
            <mj-table font-size="14px" line-height="140%" color="#4D525B">
              <tr style="text-align: left;">
                <td style="padding: 10px 0; width:40%">
                  <strong>
                    Order number
                  </strong>
                </td>
                <td style="padding: 10px 0; width:0%"></td>
                <td style="padding: 10px 0; width:80%">
                  #${order.id}</td>
              </tr>
              <td style="padding: 10px 0; width:40%">
                <strong>
                  Order date
                </strong>
              </td>
              <td style="padding: 10px 0; width:0%"></td>
              <td style="padding: 10px 0; width:80%">                               
                ${orderDate}</td>
              </tr>
              <tr style="text-align: left;">
                <td style="padding: 10px 0; width:40%"><strong>Subscription period</strong></td>
                <td style="padding: 10px 0; width:0% "></td>
                <td style="padding: 10px 0; width:80%">${getSubscriptionPeriod()}</td>
              </tr>
              <tr style="text-align: left;">
                <td style="padding: 10px 0; width:40%"><strong>Tenant</strong></td>
                <td style="padding: 10px 0; width:0% "></td>
                <td style="padding: 10px 0; width:80%">${
                  tenantInfo.identifier
                }</td>
              </tr>
            </mj-table>
          </mj-column>
        </mj-section>
        <mj-section padding="5px 0">
        </mj-section>
        <mj-section padding="15px 0px" background-color="#F6F6F6" border-radius="12px">
          <mj-column>
            <mj-text font-size="14px" line-height="140%" color="#4D525B" padding="10px 25px 0px">
              <strong>Customer </strong>
            </mj-text>
            <mj-text font-size="14px" line-height="170%" color="#4D525B">
              ${customerFullName} </br>
              ${email}
            </mj-text>
          </mj-column>
          <mj-column>
            <mj-text font-size="14px" line-height="140%" padding="10px 25px 0px" color="#4D525B"> <strong>Billing address</strong>
            </mj-text>
            <mj-text font-size="14px" line-height="170%" color="#4D525B">
              ${billingAddress.street || ""}</br>
              ${billingAddress.city || ""}</br>
              ${billingAddress.country}
            </mj-text>
          </mj-column>
        </mj-section>
        <mj-section padding="5px 0">
        </mj-section>
        <mj-section background-color="#F6F6F6" border-radius="12px" padding="15px 0px">
          <mj-column>
            <mj-text font-size="14px" line-height="170%" padding="10px 25px 5px" color="#4D525B">
              <strong>Order summary </strong>
            </mj-text>
            <mj-table line-height="140%" color="#4D525B">
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <td style="padding: 10px 0; width:50%">Crystallize ${planName} plan</td>
                <td style="padding: 10px 0; width:30% "></td>
                <td style="padding: 10px 0; width:20%; text-align:right;">$${planBasePrice}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <td style="padding: 10px 0; width:50%">
                  <mj-text>Bandwidth (gb)</mj-text></br>
                </td>
                <td style="padding: 10px 0; width:30% ">
                  <mj-text>${bandwidthMeter.usage} / ${
      planLimits.bandwidth.max_bandwidth
    } </mj-text>
                </td>
                <td style="padding: 10px 0; width:20%; text-align:right;">$${
                  bandwidthMeter.price
                }</td>
              </tr>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <td style="padding: 10px 0; width:50%">
                  <mj-text>Orders</mj-text></br>
                </td>
                <td style="padding: 10px 0; width:30%; font-weight:600;">
                  <mj-text>${ordersMeter.usage} / ${
      planLimits.orders.max_orders
    }</mj-text>
                </td>
                <td style="padding: 10px 0; width:20%; text-align:right;">$${
                  ordersMeter.price
                }</td>
              </tr>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <td style="padding: 10px 0; width:50%;">
                  <mj-text>Catalogue items</mj-text></br>
                </td>
                <td style="padding: 10px 0; width:30%; ">
                  <mj-text>${itemsMeter.usage} / ${
      planLimits.items.max_items
    }</mj-text>
                </td>
                <td style=" padding: 10px 0; width:20%; text-align:right;">$${
                  itemsMeter.price
                }</td>
              </tr>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <td style="padding: 10px 0; width:50%;">
                  <mj-text>API calls</mj-text></br>
                </td>
                <td style="padding: 10px 0; width:30%;">
                  <mj-text>${apiCallsMeter.usage} / ${
      planLimits.apiCalls.max_api_calls
    }</mj-text>
                </td>
                <td style=" padding: 10px 0; width:20%; text-align:right;">$${
                  apiCallsMeter.price
                }</td>
              </tr>
              <tr>
                <td style="width:50%; padding-top:30px"></td>
                <td style="width:30%; padding-top:30px">${vatTitle}</td>
                <td style="width:20%; text-align:right; padding-top:30px">
                  $${vatAmount}
                </td>
              </tr>
              <td style="width:50%; padding-top:0px"></td>
              <td style="width:30%; padding-top:0px"><b>Total</b></td>
              <td style="width:20%; text-align:right; padding-top:0px">
                <strong>
                  ${formatCurrency({
                    amount: order.total.gross,
                    currency: order.total.currency,
                  })}
                </strong>
              </td>
              </tr>
            </mj-table>
          </mj-column>
        </mj-section>
        <mj-section>
          <mj-column>
            <mj-text padding="10px 0" line-height="150%" color="#4D525B">
              Org Number: NO 919134216 MVA <br /><br />
              Crystallize AS <br />
              Kverndalsgata 8 <br />
              3717 Skien <br />
              Norway
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
