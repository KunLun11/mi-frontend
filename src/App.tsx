import { Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/components/RequireAuth";
import { Toaster } from "@/components/Toaster";
import { useMe } from "@/hooks/useMe";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import ClientDashboardPage from "@/pages/ClientDashboardPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import PsychologistDashboardPage from "@/pages/PsychologistDashboardPage";
import PsychologistOnboardingPage from "@/pages/PsychologistOnboardingPage";
import QuizPage from "@/pages/QuizPage";
import RecommendationsPage from "@/pages/RecommendationsPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";

export default function App() {
  // Восстанавливаем пользователя из токена при старте приложения.
  useMe();

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route
          path="/quiz"
          element={
            <RequireAuth role="client">
              <QuizPage />
            </RequireAuth>
          }
        />
        <Route
          path="/recommendations/:quizId"
          element={
            <RequireAuth role="client">
              <RecommendationsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/client"
          element={
            <RequireAuth role="client">
              <ClientDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/psychologist"
          element={
            <RequireAuth role="psychologist">
              <PsychologistDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/onboarding/psychologist"
          element={
            <RequireAuth role="psychologist">
              <PsychologistOnboardingPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  );
}
