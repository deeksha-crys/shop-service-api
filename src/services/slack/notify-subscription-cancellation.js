const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const informSubscriptionCancellation = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

const constructSlackPayload = ({
  planName,
  customerIdentifier,
  productSubscriptionId,
  firstName,
  lastName,
  email,
}) => {
  return {
    text: `Subscription plan cancelled. `,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `❌ ${planName} subscription plan cancelled. Customer and subscription details below 👇`,
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: `*Crystallize Customer ID *\n${customerIdentifier}`,
          },
          {
            type: "mrkdwn",
            text: `*Customer Name *\n${firstName} ${lastName}`,
          },
          {
            type: "mrkdwn",
            text: `*Customer email *\n${email}`,
          },
          {
            type: "mrkdwn",
            text: `*Plan cancelled *\n${planName}`,
          },
          {
            type: "mrkdwn",
            text: `*Cancelled Product Subscription ID *\n${productSubscriptionId}`,
          },
        ],
      },
    ],
  };
};

module.exports = { informSubscriptionCancellation };
