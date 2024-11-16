import React, { useEffect, useState } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../lib/dynamic";
import Spinner from "./Spinner";

const Login: React.FC = () => {
  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const signIn = async () => {
      if (!user) {
        try {
          await telegramSignIn({ forceCreateUser: true });
        } catch (error) {
          console.error("Telegram sign-in failed:", error);
        }
      }
      setIsLoading(false);
    };

    signIn();
  }, [sdkHasLoaded, user, telegramSignIn]);

  return isLoading ? <Spinner /> : <DynamicWidget />;
};

export default Login;
