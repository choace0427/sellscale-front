import { MsgResponse } from "src";
import { processResponse } from "./utils";
import { API_URL } from "@constants/data";

/**
 * Generate research points for a prospect
 * @param userToken 
 * @param prospectId 
 * @returns - MsgResponse
 */
export async function generateResearchPoints(userToken: string, prospectId: number, hardRefresh?: boolean): Promise<MsgResponse> {
  if (hardRefresh === undefined) hardRefresh = false;

  const response = await fetch(
    `${API_URL}/research/account_research_points/generate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prospect_id: prospectId,
        hard_refresh: hardRefresh,
      })
    }
  );
  // TODO: Handle error or failure

  return { status: 'success', title: `Success`, message: `Generating research points` };

}
