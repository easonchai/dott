import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook
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
  const navigate = useNavigate(); // Initialize useNavigate hook

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

  useEffect(() => {
    if (user) {
      // Redirect to Home page if the user is logged in
      navigate("/home");
    }
  }, [user, navigate]); // Ensure navigation happens when user changes

  return isLoading ? <Spinner /> : <DynamicWidget />;
};

export default Login;
