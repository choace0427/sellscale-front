import { MsgResponse } from "src";
import { isMsgResponse, processResponse } from "./utils";
import { API_URL } from "@constants/data";

/**
 * Snoozed a prospect for a given number of days
 * @param userToken 
 * @param prospectId 
 * @param days 
 * @returns - MsgResponse
 */
export async function snoozeProspect(userToken: string, prospectId: number, days: number): Promise<MsgResponse> {

  const response = await fetch(
    `${API_URL}/prospect/${prospectId}/send_to_purgatory?days=${days}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }
  );
  return await processResponse(response);

}


/**
 * Snoozed a prospect for a given number of days
 * @param userToken 
 * @param prospectId 
 * @param days 
 * @returns - MsgResponse
 */
export async function snoozeProspectEmail(userToken: string, prospectId: number, days: number): Promise<MsgResponse> {

  const response = await fetch(
    `${API_URL}/prospect/${prospectId}/email/snooze`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        num_days: days
      })
    }
  );
  return await processResponse(response);

}