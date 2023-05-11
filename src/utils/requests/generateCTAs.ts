import { MsgResponse } from "src";
import { processResponse } from "./utils";
import { API_URL } from "@constants/data";

/**
 * Generate CTA ideas
 * @param userToken 
 * @param company 
 * @param persona 
 * @param proposition 
 * @returns - MsgResponse
 */
export async function generateCTAs(userToken: string, company: string, persona: string, proposition: string): Promise<MsgResponse> {

  const response = await fetch(
    `${API_URL}/message_generation/generate_ai_made_ctas`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "company_name": company,
        "persona": persona,
        "with_what": proposition,
      }),
    }
  );
  return processResponse(response, 'ctas');

}
