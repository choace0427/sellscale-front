import { logout } from "@auth/core";
import { showNotification } from "@mantine/notifications";
import { MsgResponse } from "src/main";
import createCTA from "./createCTA";

export default async function createPersona(userToken: string, name: string, ctas: string[]): Promise<MsgResponse> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URI}/client/archetype`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archetype: name,
        disable_ai_after_prospect_engaged: true,
      }),
    }
  );
  if (response.status === 401) {
    logout();
    return { status: 'error', title: `Not Authorized`, message: 'Please login again.' };
  }
  if (response.status !== 200) {
    showNotification({
      id: "persona-create-not-okay",
      title: "Error",
      message: `Responded with: ${response.status}, ${response.statusText}`,
      color: "red",
      autoClose: false,
    });
    return { status: 'error', title: `Error`, message: `Responded with: ${response.status}, ${response.statusText}` };
  }
  const res = await response.json().catch((error) => {
    console.error(error);
    showNotification({
      id: "persona-create-error",
      title: "Error",
      message: `Error: ${error}`,
      color: "red",
      autoClose: false,
    });
  });
  if (!res) {
    return { status: 'error', title: `Error`, message: `See logs for details` };
  }

  const personaId = res.client_archetype_id;
  for (const cta of ctas) {
    const result = await createCTA(userToken, personaId, cta);
    if(result.status === 'error') return result;
  }

  return { status: 'success', title: `Success`, message: `Persona and CTAs have been created`, extra: personaId };
}
