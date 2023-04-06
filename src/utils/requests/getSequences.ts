import { MsgResponse } from "src/main";
import getResponseJSON, { isMsgResponse } from "./utils";

/**
 * Get all sequences for a user
 * @param userToken 
 * @returns - MsgResponse
 */
export async function getSequences(userToken: string): Promise<MsgResponse> {

  const response = await fetch(
    `${process.env.REACT_APP_API_URI}/integration/sequences-auth`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }
  );
  const result = await getResponseJSON("get-all-sequences", response);
  if(isMsgResponse(result)) { return result; }

  return { status: 'success', title: `Success`, message: `Gathered all sequences`, extra: result.sequence_options };

}


/**
 * Save a sequence to a given persona
 * @param userToken 
 * @returns - MsgResponse
 */
export async function saveSequenceToPersona(userToken: string, personaId: string, sequenceId: string): Promise<MsgResponse> {

  const response = await fetch(
    `${process.env.REACT_APP_API_URI}/integration/set-persona-sequence`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "persona_id": +personaId,
        "sequence_id": +sequenceId,
      }),
    }
  );
  const result = await getResponseJSON("save-sequence-to-persona", response);
  if(isMsgResponse(result)) { return result; }

  return { status: 'success', title: `Success`, message: `Set sequence` };

}
