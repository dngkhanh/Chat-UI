import { jwtDecode } from "jwt-decode";
import React, { useEffect, useRef, useState } from "react";
import { token } from "../../../store/tokenContext";
import user from "../../../store/accountContext";
import { MessageDto } from "../ChatBox/ChatBox";
import socketService from "../../../../socket/Socket";

const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg"];

interface InsertMessageProps {
  props: [MessageDto, number];
}

export function InsertMessage({ props }: InsertMessageProps) {
  const socket: any = socketService;
  const [msg, conversationId] = props;

  const [showOption, setShowOption] = useState<boolean>(false);
  const [showDate, setShowDate] = useState<boolean>(false);
  const content = (msg.content || "").split(" ");
  const contentRef = useRef<HTMLDivElement>(null);

  const onMouse = () => {
    setShowOption(!showOption);
  };

  const isDelete = () => {
    if (window.confirm("Are you sure you want to delete this message ?")) {
      fetch(`http://localhost:8080/chats/delete/${msg.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(() => {
        socketService.emit("delete_message", { otherId: conversationId });
        if (contentRef.current) {
          contentRef.current.innerHTML = "<b>Message has been delete</b>";
        }
        setShowOption(false);
      });
    }
  };

  return (
    <div
      className={
        msg.user?.id === user.id ? "message-right" : "message-left"
      }
    >
      <div className="transparent"></div>
      <div className="message-wrap">
        {showOption && msg.user?.id === user.id && (
          <div className="option-chat">
            <button onClick={isDelete}>D.Hard</button>
            <button onClick={() => setShowDate(!showDate)}>More</button>
          </div>
        )}
        <div className="wrap-option">
          {msg.user?.id !== user.id && (
            <div className="user-coming">{msg.user?.firstName + " " + msg.user?.lastName}</div>
          )}
          <div className="user-content" onClick={onMouse}>
            <i className="message-content" ref={contentRef}>
              {content.map((item, index) => {
                const isImage =
                  imageExtensions.some((ext) => item.endsWith("." + ext)) ||
                  item.startsWith("data:image") ||
                  item.startsWith("https://");
                return isImage ? (
                  <a
                    href={item}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={index}
                  >
                    <img src={item} alt="content" />
                  </a>
                ) : (
                  item + " "
                );
              })}
            </i>
          </div>
          {showDate && (
            <div>
              <i
                style={{
                  color: "white",
                  background: "green",
                  fontSize: "12px",
                  borderRadius: "20px",
                  padding: "1px 3px",
                }}
              >
                {msg.timestamp?.toString()}
              </i>
            </div>
          )}
        </div>
        {showOption && msg.user?.id !== user.id && (
          <div className="option-chat">
            <button>Delete</button>
            <button onClick={() => setShowDate(!showDate)}>More</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InsertMessage;
