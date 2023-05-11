import { MsgResponse } from "src";
import { processResponse } from "./utils";
import { API_URL } from "@constants/data";

/**
 * Modifies a bump framework
 * @param userToken 
 * @param overallStatus
 * @param title
 * @param description
 * @param length
 * @param setDefault
 * @returns - MsgResponse
 */
export async function createBumpFramework(userToken: string, overallStatus: string, title: string, description: string, length: string, setDefault: boolean): Promise<MsgResponse> {

  const response = await fetch(
    `${API_URL}/bump_framework/bump`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        overall_status: overallStatus,
        title: title,
        description: description,
        default: setDefault,
        length: length,
      })
    }
  );
  return await processResponse(response, 'bump_framework_id');

}
