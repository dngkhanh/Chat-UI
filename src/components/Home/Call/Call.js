import React, { useContext, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { jwtDecode } from "jwt-decode";
import { decodeToken } from "../../store/tokenContext";
import { ClickContext } from "../Chat/ChatBox/ChatBox";
import Draggable, {DraggableCore} from "react-draggable";
import './call.scss'
import socketService from "../../../socket/Socket";
const { username, sub, image } = decodeToken;
function VideoCall(props) {
    const socket = socketService
    const [stream, setStream] = useState(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [idToCall, setIdToCall] = useState("");
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");

    const userVideo = useRef({});
    const connectionRef = useRef(null);
    const myVideo = useRef({});

    const [isCaller, setIsCaller] = useState(true);

    // option call
    const [optionCall, setOptionCall] = useState(false);

    // useEffect(() => {
    //     console.log('myVideo  ', myVideo);
    // }, [myVideo])
    // useEffect(() => {
    //     console.log('userVideo', userVideo);
    // }, [userVideo])

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            setStream(stream);
            if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }
        })
        .catch((error) => {
            console.error("Error accessing media devices:", error);
        });

        socketService.listen("callUser", (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setName(data.name);
            setCallerSignal(data.signal);
        });
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            setStream(stream);
            if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }
        })
        .catch((error) => {
            console.error("Error accessing media devices:", error);
        });
    }, []);
    
    const callUser = (id) => {
        setIsCaller(false);
        console.log("call uer 1");
        socketService.emit('sendMessage', {
            from_id: sub,
            from: username,
            content: `📞 We have a video call from ${username} 📞`,
            to_id: id
        });
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });
        peer.once("signal", (data) => {
            console.log("call uer 2");
            socketService.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: sub,
                name: username,
            });
        });

        peer.on("stream", (stream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
                console.log("Người GỌI đã nhận được tín hiệu !");
            }
        });

        socketService.listen("callAccepted", (signal) => {
            console.log('user had acept');
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setIsCaller(false);
        console.log('click ac');
        setCallAccepted(true);
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        });

        peer.once("signal", (data) => {
            socketService.emit("answerCall", { signal: data, to: caller });
        });

        peer.on("stream", (stream) => {
        if (userVideo.current) {
            console.log("Người NGHE đã nhận được tín hiệu !");
            userVideo.current.srcObject = stream;
        }
        });
        peer.signal(callerSignal);
        connectionRef.current = peer;
    };

    const refuseCall = (e) => {
        socketService.emit('refuse_call', {
            otherId: caller
        })
    }

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            try {
                console.log("repare removeStream");
                connectionRef.current.removeStream(stream);
                if (connectionRef.current.writable) {
                    connectionRef.current.send('something');
                    console.log('has write something');
                }
            } catch (error) {
                console.log(error);
            }
        }
        socketService.emit('complete_close_call', {});
    };

    // Direction video
    const [direction, setDirection] = useState(false);
    const changeDirection = (e) => {
        setDirection(!direction);
    }

  return (
    <div className="call-page">
        <Draggable>
            <div className="video-call">
                <div className="button-call">
                    {callAccepted && !callEnded ? (
                        <div>
                            <button className="give-up-call" onClick={leaveCall}>
                                End Call
                            </button>
                            <button className="start-call" onClick={changeDirection}>
                                C.Direction
                            </button>
                        </div>
                    ) : (
                        (!receivingCall && (
                            <div>
                                <button
                                    className="start-call"
                                    onClick={() => callUser(props.props)}
                                >
                                    {connectionRef.current ? 'Calling...' : 'Start Call'}
                                </button>
                                <button
                                    className="give-up-call"
                                    onClick={() => {
                                        socketService.emit('give_up_call', {
                                            otherId: props.props
                                        });
                                    }}
                                >
                                    Give Up
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {receivingCall && !callAccepted ? (
                <div className="button-call">
                    <h1 className="call-from">{name} Calling . . .</h1>
                    <button
                        className="call-ac"
                        onClick={answerCall}
                    >
                        Answer
                    </button>
                    <button
                        className="call-ac"
                        onClick={refuseCall}
                    >
                        Refuse
                    </button>
                </div>
                ) : null}




                <div className={direction ? 'video-flex-column' : 'video-flex-row'}>
                    <div className="my-video">
                        {stream && (
                        <video
                            className="rounded-full"
                            playsInline
                            muted
                            ref={myVideo}
                            onDoubleClick={isCaller ? !receivingCall ? () => callUser(props.props) : answerCall : null}
                            autoPlay
                            style={{ width: "300px" }}
                        />
                        )}
                    </div>

                    <div className="user-video">
                        {callAccepted && !callEnded ? (
                            <video
                                className="rounded-full"
                                playsInline
                                ref={userVideo}
                                onDoubleClick={leaveCall}
                                autoPlay
                                style={{ width: "300px" }}
                            />
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            </div>
        </Draggable>
        <div className="option-call">
            {optionCall ? 
                <div className="option-call">
                
                    {callAccepted && !callEnded ?
                        
                        <button onClick={() => leaveCall()} >Stop Call</button>
                    :
                        (!receivingCall && 
                            <><button onClick={() => callUser(props.props)} >Start Call</button>
                            <button onClick={() => {
                                        console.log('x',props.props)

                                    socketService.emit('give_up_call', {
                                        otherId: props.props
                                    });
                            }}>Give Up</button></>
                        )
                    }
                    {receivingCall && !callAccepted ?
                        <><button onClick={() =>answerCall()} >Answer</button>
                        <button onClick={() => refuseCall()}>Refuse</button></>
                    : null }
                    <button onClick={(e) => {
                        const target = e.target.parentNode;
                        if(target) target.classList.toggle('option-column');
                        console.log(target);
                    }}>C.Direction</button>
                    <button onClick={() => setOptionCall(false)} className="button-option"> Close Option </button>
                </div>
            :
                <button onClick={() => setOptionCall(true)} className="button-option"> Option Call </button>
            }
        </div>

    </div>
  );
}

export default VideoCall;

