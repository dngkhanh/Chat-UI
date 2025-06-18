import { jwtDecode } from "jwt-decode";
import { decodeToken } from "../store/tokenContext";
import React, {
  useContext,
  useEffect,
  useState,
  createContext,
  useRef,
} from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Success from "../Alert/Success";
import "./Auth.scss";
import Error from "../Alert/Error";

interface FormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  image: string;
}

interface RegisterResponse {
  statusCode: number;
  message: string;
  data?: {
    id: number;
    email: string;
    name: string;
    phone: string;
    address: string;
    image: string;
  };
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
    image: "",
  });

  const [alertTag, setAlertTag] = useState<React.ReactNode>();

  const submitForm = async (): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:8080/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data: RegisterResponse = await response.json();
      
      if (data.statusCode === 201) {
        setAlertTag(
          <Success
            value={[`Register Success`, "Back to login page after 3s !"]}
          />
        );
        setTimeout(() => {
          setAlertTag("");
          window.location.href = "/login";
        }, 3000);
      } else {
        setAlertTag(<Error value={[`Register Fail`, data.message]} />);
        setTimeout(() => {
          setAlertTag("");
        }, 8000);
      }
    } catch (error) {
      setAlertTag(<Error value={[`Register Fail`, "Happen Error !"]} />);
      setTimeout(() => {
        setAlertTag("");
      }, 8000);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (formData.email && formData.password && formData.name) submitForm();
    else {
      setAlertTag(
        <Error
          value={[`Register Fail`, "Please fill full significant infomation !"]}
        />
      );
      setTimeout(() => {
        setAlertTag("");
      }, 8000);
    }
  };

  return (
    <>
      <div className="login-page">
        {alertTag}
        <form onSubmit={handleFormSubmit} className="form-login">
          <div className="submit_center">
            <h2 className="title">
              Please, fill your information
            </h2>
          </div>
          <label>User Email*</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <label>Name*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <label>Password*</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          <label>Phone Number*</label>
          <input
            type="number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
          <label>Image (Link)</label>
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
          />
          <img src={formData.image} className="review-avatar" alt="Preview" />
          <div className="submit_center">
            <button type="submit">Register</button>
          </div>
          <div className="submit_center">
            <NavLink to="/login" className={"register"}>
              Back To Login Page
            </NavLink>
          </div>
        </form>
      </div>
    </>
  );
};

export default Register; 