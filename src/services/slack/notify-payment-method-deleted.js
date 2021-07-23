const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const notifyPaymentMethodDelete = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

const constructSlackPayload = ({
  customer,
  billing_details,
  paymentMethodId,
  crystallizeCustomerIdentifier,
}) => {
  return {
    text: `Payment method deleted.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `💳 Payment method  deleted in Crystallize. The card is not attached to customer anymore.`,
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: `*Cardholder name *\n${billing_details.name}`,
          },
          {
            type: "mrkdwn",
            text: `*Stripe CustomerID *\n${customer}`,
          },
          {
            type: "mrkdwn",
            text: `*Crystallize Customer ID*\n${crystallizeCustomerIdentifier}`,
          },
          {
            type: "mrkdwn",
            text: `*Payment Method ID for deleted card*\n${paymentMethodId}`,
          },
        ],
      },
    ],
  };
};

module.exports = { notifyPaymentMethodDelete };
