import React, { useState } from "react";
import Picker from "emoji-picker-react";
import './emoji.scss'

export default function Emoji(props) {
    const [chosenEmoji, setChosenEmoji] = useState(null);
    
    const onEmojiClick = (event, emojiObject) => {
        setChosenEmoji(emojiObject);
        
        // Nếu có prop onEmojiClick được truyền từ ChatForm, sử dụng nó
        if (props.onEmojiClick) {
            props.onEmojiClick(event, emojiObject);
        } else {
            // Fallback cho trường hợp sử dụng ref (tương thích ngược)
            const inputRef = props.value;
            if (inputRef && inputRef.current) {
                inputRef.current.value = inputRef.current.value + `${event.emoji} `;
            }
        }
    };

    return (
        <div className='emoji'>
            <div className="picker">
                <Picker
                    onEmojiClick={onEmojiClick}
                    theme="light"
                    searchDisabled={false}
                    skinTonesDisabled={false}
                    previewConfig={{ showPreview: false }}
                    width={340}
                    height={400}
                    lazyLoadEmojis={true}
                    emojiStyle="apple"
                    autoFocusSearch={false}
                    suggestedEmojisMode="recent"
                />
            </div>
        </div>
    );
}