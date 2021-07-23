const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const informPaymentSuccessToCrystallize = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

const constructSlackPayload = ({
  customer,
  customer_email,
  customer_name,
  total,
  tenantId,
  orderId,
}) => {
  return {
    text: `Subscription plan successfully renewed for ${customer_name}.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🎊 🎊 Payment collected for Tenant ID: ${tenantId}. The subscription is successfully renewed`,
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: `*Customer Email*\n${customer_email}`,
          },
          {
            type: "mrkdwn",
            text: `*Customer Name*\n${customer_name}`,
          },
          {
            type: "mrkdwn",
            text: `*Stripe Customer ID *\n${customer}`,
          },
          {
            type: "mrkdwn",
            text: `*Total amount paid*\n$${total}`,
          },
          {
            type: "mrkdwn",
            text: `*Crystallize Order ID*\n${orderId}`,
          },
          {
            type: "mrkdwn",
            text: `*Crystallize Tenant ID*\n${tenantId}`,
          },
        ],
      },
    ],
  };
};

module.exports = {
  informPaymentSuccessToCrystallize,
};
