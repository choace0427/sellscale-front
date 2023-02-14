import { userEmailState, userNameState, userTokenState } from "@atoms/userAtoms";
import { authorize } from "@auth/core";
import {
  LoadingOverlay,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import PageFrame from "../common/PageFrame";

async function sendAuthToken(authToken: string, email: string) {

  console.log(authToken, email);

  const response = await fetch(`${process.env.REACT_APP_API_URI}/client/approve_auth_token`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'client_sdr_email': email,
      'token': authToken,
    })
  });
  return await response.json().catch((error) => {
    console.error(error);
    showNotification({
      id: 'auth-error',
      title: 'Error',
      message: `Error: ${error}`,
      color: 'red',
      autoClose: false,
    });
  });

}

export default function AuthPage() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userEmail = useRecoilValue(userEmailState);
  const [userName, setUserName] = useRecoilState(userNameState);
  const [userToken, setUserToken] = useRecoilState(userTokenState);

  useEffect(() => {
    const tokenType = searchParams.get('stytch_token_type');
    const authToken = searchParams.get('token');

    if (tokenType !== 'magic_links'){
      showNotification({
        id: 'auth-invalid-token-type',
        title: 'Invalid token type',
        message: `Token type "${tokenType}" was not expected!`,
        color: 'red',
        autoClose: false,
      });
      console.error('Invalid token type', tokenType);
      return;
    }
    if (!authToken){
      showNotification({
        id: 'auth-invalid-token',
        title: 'Invalid token',
        message: `Token "${authToken}" is invalid!`,
        color: 'red',
        autoClose: false,
      });
      console.error('Invalid token', tokenType);
      return;
    }

    sendAuthToken(authToken, userEmail).then((response) => {
      console.log(response);

      authorize('4dWDIYgxOqC1JTmXI0UKTDTXPumZ5XXi', setUserToken, 'Aaron Cassar', setUserName);
      navigate(`/`);

    });

  }, [searchParams, userEmail]);

  return (
    <PageFrame>
      <LoadingOverlay visible={true} overlayBlur={2} />
    </PageFrame>
  );
}
