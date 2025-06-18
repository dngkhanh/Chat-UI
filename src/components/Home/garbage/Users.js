import { useState } from "react";
import { useEffect } from "react";
import "./Products.scss"
function Users(socket) {
    const limit = 12;
    const [numPage, setNumPage] = useState(0);
    const [data, setData] = useState([]);
    const [skip, setSkip] = useState(0);
    useEffect(() => {
        fetch(`https://dummyjson.com/users?skip=${skip}&limit=${limit}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            setData(data.users);
            setNumPage(Math.ceil(data.total/limit));
        })
    }, [skip]);
    const handle = (e) => {
        const dataPage = e.target.getAttribute("data-page");
        
        setSkip((dataPage-1)*limit);
    }
    return (
        <>
            <div className="product">
                {(data || []).map((item, index) => {
                    return (
                        <div className="product_card" key={index}>
                            <div className="product_wrap">
                                <div className="product_content">
                                    <img src={item.image} className="product_thumbnail" />
                                    <b className="product_title">{item.firstName} {item.lastName} ({item.maidenName})</b>
                                    <div className="product_price">{item.age} Age</div>
                                    <i className="product_desc">{item.email}</i>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="pagination">
                <ul className="pagination_wrap">
                    {([...Array(numPage)] || []).map((_, index) => {
                        return <li data-page={index + 1} key={index} onClick={handle}>{index+1}</li>
                    })}
                </ul>
            </div>
        </>
    )
}

export default Users;