import { API_URL } from "@constants/data";
import { showNotification } from "@mantine/notifications";
import { MsgResponse } from "src";
import getResponseJSON, { isMsgResponse } from "./utils";

/**
 * Modifies the ICP Prompt for a given archetype
 * @param userToken
 * @param archetypeID
 * @param newPrompt
 * @returns - MsgResponse
 */
export default async function postICPClassificationPromptChange(userToken: string, archetypeID: number, newPrompt: string): Promise<MsgResponse> {
  const response = await fetch(
    `${API_URL}/ml/icp_classification/icp_prompt/${archetypeID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: newPrompt,
        send_slack_message: true,
      }),
    }
  );
  const result = await getResponseJSON("icp_prompt_change", response);
  if(isMsgResponse(result)) { return result; }

  return { status: 'success', title: `Success`, message: `Pulse prompt changed successfully` };
}