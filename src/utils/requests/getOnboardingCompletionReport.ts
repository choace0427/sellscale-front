import { MsgResponse } from 'src';
import { processResponse } from './utils';
import { API_URL } from '@constants/data';

/**
 * Get onboarding completion report
 * @param userToken
 * @returns - MsgResponse
 */
export async function getOnboardingCompletionReport(userToken: string): Promise<MsgResponse> {
  // const response = await fetch(
  //   `${API_URL}/client/sdr/onboarding_completion_report`,
  //   {
  //     method: "GET",
  //     headers: {
  //       Authorization: `Bearer ${userToken}`,
  //     },
  //   }
  // );
  //return await processResponse(response, 'data');
  // This was being called way way too often, so I'm just going to return a dummy response for now
  return {
    status: 'error',
    title: '',
    message: '',
  } satisfies MsgResponse;
}
