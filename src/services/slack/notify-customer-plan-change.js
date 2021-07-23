const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const informSubscriptionPlanChange = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

//TODO: Add tenantId also
const constructSlackPayload = ({ tenantId, oldPlan, newPlan }) => {
  return {
    text: `Subscription plan changed for tenantId ${tenantId}. `,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:star: TenantId ${tenantId} changed subscription plan from ${oldPlan} to ${newPlan}`,
        },
      },
    ],
  };
};

module.exports = { informSubscriptionPlanChange };
