import React from "react";
import { Chat } from "./Chat/ChatPage";
import "./Home.scss";

function Home(): JSX.Element {
  return (
    <div className="home">
      <Chat />
    </div>
  );
}

export default Home;
