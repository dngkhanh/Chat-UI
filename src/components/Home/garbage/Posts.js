import { useState } from "react";
import { useEffect } from "react";
import "./Products.scss";
function Products() {
  const limit = 12;
  const [numPage, setNumPage] = useState(0);
  const [data, setData] = useState([]);
  const [skip, setSkip] = useState(0);
  useEffect(() => {
    fetch(`https://dummyjson.com/products?skip=${skip}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data.products);
        setNumPage(Math.ceil(data.total / limit));
        console.log(numPage);
        console.log([...Array(numPage)]);
      });
  }, [skip]);
  const handle = (e) => {
    const dataPage = e.target.getAttribute("data-page");
    setSkip((dataPage - 1) * limit);
  };
  console.log("dfd");
  return (
    <>
      <div className="product">
        {(data || []).map((item, index) => {
          return (
            <div className="product_card" key={index}>
              <div className="product_wrap">
                <div className="product_content">
                  <img src={item.thumbnail} className="product_thumbnail" />
                  <div className="product_title">{item.title}</div>
                  <div className="product_price">{item.price}$</div>
                  <i className="product_desc">{item.description}</i>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pagination">
        <ul className="pagination_wrap">
          {([...Array(numPage)] || []).map((_, index) => {
            return (
              <li data-page={index + 1} key={index} onClick={handle}>
                {index + 1}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default Products;
