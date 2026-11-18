import { useEffect, useState, type ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Splash } from "@/components/game/Splash";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [App, setApp] = useState<ComponentType | null>(null);
  useEffect(() => {
    void import("@/components/game/GameApp").then((mod) => setApp(() => mod.GameApp));
  }, []);
  if (!App) return <Splash />;
  return <App />;
}
