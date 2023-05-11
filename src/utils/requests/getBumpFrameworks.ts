import { MsgResponse } from "src";
import { processResponse } from "./utils";
import { API_URL } from "@constants/data";

/**
 * Gets bump frameworks
 * @param userToken 
 * @param overallStatus
 * @returns - MsgResponse
 */
export async function getBumpFrameworks(userToken: string, overallStatus: string): Promise<MsgResponse> {

  const response = await fetch(
    `${API_URL}/bump_framework/bump?overall_status=${overallStatus}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userToken}`,
      }
    }
  );
  return await processResponse(response, 'bump_frameworks');

}
