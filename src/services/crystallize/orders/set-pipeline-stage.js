const { callPimApi } = require("../utils");

const CRYSTALLIZE_PIPELINE_ID = process.env.CRYSTALLIZE_PIPELINE_ID;

const pipelineStageNameToID = {
  new: process.env.CRYSTALLIZE_NEW_ORDER_STAGE_ID,
  success: process.env.CRYSTALLIZE_SUCCESS_ORDER_STAGE_ID,
  fail: process.env.CRYSTALLIZE_FAILED_ORDER_STAGE_ID,
};

module.exports = async function setPipelineStage({ orderId, stageName }) {
  console.log("orderId received -> ", orderId);
  console.log("stageId received -> ", pipelineStageNameToID[stageName]);
  const response = await callPimApi({
    variables: {
      orderId: orderId,
      pipelineId: CRYSTALLIZE_PIPELINE_ID,
      stageId: pipelineStageNameToID[stageName],
    },
    query: `
      mutation setPipelineStage(
        $orderId: ID! 
        $pipelineId: ID!
        $stageId: ID!
      ){
        order {
          setPipelineStage(orderId: $orderId, pipelineId: $pipelineId, stageId: $stageId) {
            id
            tenantId
          }
        }
      }
    `,
  });
  console.log("response from setPipelineStage", response);
  return response.data.order;
};
