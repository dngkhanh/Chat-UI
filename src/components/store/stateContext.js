import { createContext, useState } from "react";

export const StateContext = createContext({
    isLoad: '',
    setIsLoad: () => {},
})


const StateContextProvider = ({children}) => {

    const [isLoad, setIsLoad] = useState('');

    const setIsLoadDefine = (id) => {
        setIsLoad(id);
        console.log(isLoad);
    }
    return ( 
        <StateContext.Provider value={{isLoad, setIsLoad}}>
            {children}
        </StateContext.Provider>
    )
}

export default StateContextProvider;


// file nao wrap dau em Loi, alo 