import { MsgResponse } from "src";
import getResponseJSON, { isMsgResponse } from "./utils";
import { API_URL } from "@constants/data";

/**
 * Modifies a bump framework
 * @param userToken 
 * @param overallStatus
 * @param title
 * @param description
 * @param setDefault
 * @returns - MsgResponse
 */
export async function createBumpFramework(userToken: string, overallStatus: string, title: string, description: string, setDefault: boolean): Promise<MsgResponse> {

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
      })
    }
  );
  const result = await getResponseJSON("create_bump_framework", response);
  if (isMsgResponse(result)) { return result; }

  return { status: 'success', title: `Success`, message: `Bump framework created.`, extra: result.bump_framework_id};

}
